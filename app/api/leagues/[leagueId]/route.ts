import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'

export async function GET(req: NextRequest, { params }: { params: { leagueId: string } }) {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { leagueId } = params

  const { data: room } = await supabase.from('leagues').select('id, name').eq('id', leagueId).single()
  if (!room) return NextResponse.json({ error: 'League not found' }, { status: 404 })

  const { data: members } = await supabase
    .from('league_members')
    .select('player_id, players(id, username)')
    .eq('league_id', leagueId)

  if (!members) return NextResponse.json({ room, leaderboard: [] })

  const { data: actualResults } = await supabase.from('actual_results').select('*')

  const leaderboard = await Promise.all(
    members.map(async member => {
      const player = member.players as unknown as { id: string; username: string }
      const { data: bracket } = await supabase
        .from('brackets')
        .select('id')
        .eq('player_id', player.id)
        .single()

      if (!bracket) return { username: player.username, groupPoints: 0, knockoutPoints: 0, total: 0 }

      const [{ data: gp }, { data: kp }] = await Promise.all([
        supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
      ])

      const score = computeScore(gp ?? [], kp ?? [], actualResults ?? [])
      return { username: player.username, ...score }
    })
  )

  leaderboard.sort((a, b) => b.total - a.total)

  return NextResponse.json({ room, leaderboard })
}
