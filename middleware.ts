import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { SessionData } from '@/types'

const PUBLIC_PATHS = ['/', '/register', '/login']
const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'fifa2026-session',
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and all API routes
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS)

  if (!session.playerId) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
