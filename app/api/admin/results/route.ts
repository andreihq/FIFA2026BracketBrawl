import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-password')
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { result_type, ref_id, entries } = await req.json() as {
    result_type: 'group' | 'knockout'
    ref_id: string
    entries: Array<{ team_code: string; position?: number }>
  }

  const supabase = createServerClient()

  await supabase.from('actual_results').delete().eq('ref_id', ref_id)

  const rows = entries.map(e => ({
    result_type,
    ref_id,
    team_code: e.team_code,
    position: e.position ?? null,
  }))

  const { error } = await supabase.from('actual_results').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
