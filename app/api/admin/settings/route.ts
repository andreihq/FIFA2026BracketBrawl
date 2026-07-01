import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/session'
import { requireSameOrigin } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrfError = requireSameOrigin(req)
  if (csrfError) return csrfError

  const { deadline } = await req.json()
  if (!deadline || isNaN(Date.parse(deadline))) {
    return NextResponse.json({ error: 'Invalid deadline' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'deadline', value: new Date(deadline).toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
