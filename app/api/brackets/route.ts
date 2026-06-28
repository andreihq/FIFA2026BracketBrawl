import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import type { GroupPrediction, KnockoutPrediction } from '@/types'

export async function GET() {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: bracket } = await supabase
    .from('brackets')
    .select('id, submitted_at, locked')
    .eq('player_id', session.playerId)
    .single()

  if (!bracket) return NextResponse.json({ bracket: null, groupPredictions: [], knockoutPredictions: [], actualResults: [] })

  const [{ data: groupPredictions }, { data: knockoutPredictions }, { data: actualResults }] = await Promise.all([
    supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
    supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
    supabase.from('actual_results').select('*'),
  ])

  return NextResponse.json({
    bracket,
    username: session.username,
    groupPredictions: groupPredictions ?? [],
    knockoutPredictions: knockoutPredictions ?? [],
    actualResults: actualResults ?? [],
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: deadlineSetting } = await supabase.from('settings').select('value').eq('key', 'deadline').single()
  if (deadlineSetting && new Date() > new Date(deadlineSetting.value)) {
    return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 403 })
  }
  const { groupPredictions, knockoutPredictions, submit } = await req.json() as {
    groupPredictions: Omit<GroupPrediction, 'id' | 'bracket_id'>[],
    knockoutPredictions: Omit<KnockoutPrediction, 'id' | 'bracket_id'>[],
    submit?: boolean,
  }

  // Get or create bracket
  let { data: bracket } = await supabase
    .from('brackets')
    .select('id, locked')
    .eq('player_id', session.playerId)
    .single()

  if (!bracket) {
    const { data: created } = await supabase
      .from('brackets')
      .insert({ player_id: session.playerId })
      .select('id, locked')
      .single()
    bracket = created
  }

  if (!bracket) return NextResponse.json({ error: 'Failed to create bracket' }, { status: 500 })
  if (bracket.locked) return NextResponse.json({ error: 'Bracket is locked' }, { status: 403 })

  // Replace group predictions (delete + insert so removed picks don't linger)
  await supabase.from('group_predictions').delete().eq('bracket_id', bracket.id)
  if (groupPredictions.length > 0) {
    const rows = groupPredictions.map(p => ({ ...p, bracket_id: bracket!.id }))
    await supabase.from('group_predictions').insert(rows)
  }

  // Replace knockout predictions (delete + insert so stale picks don't persist)
  await supabase.from('knockout_predictions').delete().eq('bracket_id', bracket.id)
  if (knockoutPredictions.length > 0) {
    const rows = knockoutPredictions.map(p => ({ ...p, bracket_id: bracket!.id }))
    await supabase.from('knockout_predictions').insert(rows)
  }

  if (submit) {
    await supabase
      .from('brackets')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', bracket.id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
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

  if (!bracket) return NextResponse.json({ ok: true })

  await Promise.all([
    supabase.from('group_predictions').delete().eq('bracket_id', bracket.id),
    supabase.from('knockout_predictions').delete().eq('bracket_id', bracket.id),
  ])

  await supabase.from('brackets').delete().eq('id', bracket.id)

  return NextResponse.json({ ok: true })
}
