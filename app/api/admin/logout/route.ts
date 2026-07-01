import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/csrf'
import { getAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const csrfError = requireSameOrigin(req)
  if (csrfError) return csrfError

  const session = await getAdminSession()
  session.destroy()
  await session.save()
  return NextResponse.json({ ok: true })
}
