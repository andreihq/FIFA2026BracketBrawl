import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
