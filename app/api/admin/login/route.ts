import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_PASSWORD, getAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: undefined }))

  if (typeof password !== 'string' || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const session = await getAdminSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}
