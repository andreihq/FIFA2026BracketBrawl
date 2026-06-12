import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'

export async function POST() {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: deadlineSetting } = await supabase.from('settings').select('value').eq('key', 'deadline').single()
  if (deadlineSetting && new Date() > new Date(deadlineSetting.value)) {
    return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 403 })
  }

  const { data: bracket } = await supabase
    .from('brackets')
    .select('id')
    .eq('player_id', session.playerId)
    .single()

  if (!bracket) return NextResponse.json({ error: 'No bracket found' }, { status: 404 })

  await supabase
    .from('brackets')
    .update({ submitted_at: new Date().toISOString() })
    .eq('id', bracket.id)

  return NextResponse.json({ ok: true })
}
