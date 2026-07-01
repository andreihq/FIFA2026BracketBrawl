import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionData, AdminSessionData } from '@/types'

function requireEnv(name: string, minLength: number): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`)
  }
  return value
}

const SESSION_SECRET = requireEnv('SESSION_SECRET', 32)
// Admin password policy: require at least 16 characters to avoid weak shared secrets.
export const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD', 16)

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'fifa2026-session',
  ttl: 60 * 60 * 24 * 60, // 60 days
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

// ── Admin session ─────────────────────────────────────────────────────────────
// Persists the "logged into the admin panel" state in its own encrypted cookie
// so the admin stays signed in across refreshes/visits for 30 days.

const adminSessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'fifa2026-admin',
  ttl: 60 * 60 * 24 * 30, // 30 days (>= the 7-day minimum)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getAdminSession() {
  return getIronSession<AdminSessionData>(await cookies(), adminSessionOptions)
}

/**
 * Authorize an admin API request using only a valid admin session cookie.
 *
 * When authorized, the session is re-saved so its expiry slides forward
 * (auto-refresh) — an active admin never gets logged out mid-use.
 */
export async function isAdminRequest(): Promise<boolean> {
  const session = await getAdminSession()
  if (session.isAdmin === true) {
    // Sliding expiry: re-saving resets the cookie's 30-day TTL on each request.
    await session.save()
    return true
  }
  return false
}
