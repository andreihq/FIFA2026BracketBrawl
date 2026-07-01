import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/session'
import { requireSameOrigin } from '@/lib/csrf'

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServerClient()
  const { data, error } = await supabase.from('actual_results').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ results: data })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrfError = requireSameOrigin(req)
  if (csrfError) return csrfError

  const { result_type } = await req.json() as { result_type: 'group' | 'knockout' }
  const supabase = createServerClient()
  const { error } = await supabase.from('actual_results').delete().eq('result_type', result_type)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrfError = requireSameOrigin(req)
  if (csrfError) return csrfError

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
