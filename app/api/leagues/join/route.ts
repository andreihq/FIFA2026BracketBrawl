import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { isValidLeagueCode } from '@/lib/league-code'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leagueId } = await req.json()
  if (!leagueId || !isValidLeagueCode(leagueId)) {
    return NextResponse.json({ error: 'Invalid league code format' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: room } = await supabase.from('leagues').select('id').eq('id', leagueId).single()
  if (!room) return NextResponse.json({ error: 'League not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('league_id', leagueId)
    .eq('player_id', session.playerId)
    .single()

  if (!existing) {
    await supabase.from('league_members').insert({ league_id: leagueId, player_id: session.playerId })
  }

  return NextResponse.json({ leagueId })
}
