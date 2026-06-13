import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionData } from '@/types'

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
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
