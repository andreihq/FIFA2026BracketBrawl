import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'

const DEADLINE = new Date('2026-06-15T04:59:00Z')

export async function POST() {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (new Date() > DEADLINE) {
    return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 403 })
  }

  const supabase = createServerClient()

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
