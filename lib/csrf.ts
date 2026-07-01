import { NextRequest, NextResponse } from 'next/server'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getAllowedOrigins(req: NextRequest): Set<string> {
  const origins = new Set<string>()

  origins.add(req.nextUrl.origin)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    const normalized = normalizeOrigin(appUrl)
    if (normalized) origins.add(normalized)
  }

  return origins
}

export function requireSameOrigin(req: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(req.method)) return null

  const allowedOrigins = getAllowedOrigins(req)
  const origin = req.headers.get('origin')

  if (origin) {
    const normalized = normalizeOrigin(origin)
    if (normalized && allowedOrigins.has(normalized)) return null
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const referer = req.headers.get('referer')
  if (referer) {
    const normalized = normalizeOrigin(referer)
    if (normalized && allowedOrigins.has(normalized)) return null
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
