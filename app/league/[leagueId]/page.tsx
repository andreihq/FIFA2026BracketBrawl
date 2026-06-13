import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'
import { Leaderboard } from '@/components/Leaderboard'
import { JoinLeagueButton } from '@/components/JoinLeagueButton'

export default async function LeaguePage({ params }: { params: { leagueId: string } }) {
  const session = await getSession()

  const supabase = createServerClient()
  const { data: room } = await supabase
    .from('leagues')
    .select('id, name')
    .eq('id', params.leagueId)
    .single()

  if (!room) redirect('/')

  const { data: members } = await supabase
    .from('league_members')
    .select('player_id, players(id, username)')
    .eq('league_id', params.leagueId)

  const { data: actualResults } = await supabase.from('actual_results').select('*')

  const leaderboard = await Promise.all(
    (members ?? []).map(async member => {
      const player = member.players as unknown as { id: string; username: string }
      const { data: bracket } = await supabase
        .from('brackets').select('id, submitted_at').eq('player_id', player.id).single()
      if (!bracket?.submitted_at) return { username: player.username, groupPoints: 0, knockoutPoints: 0, total: 0 }
      const [{ data: gp }, { data: kp }] = await Promise.all([
        supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
      ])
      return { username: player.username, ...computeScore(gp ?? [], kp ?? [], actualResults ?? []) }
    })
  )
  leaderboard.sort((a, b) => b.total - a.total)

  const isMember = !!session.playerId && (members ?? []).some((m) => m.player_id === session.playerId)

  return (
    <div className="min-h-screen p-5 max-w-2xl mx-auto">

      <div className="anim-fade-up pt-2 mb-7">
        <p className="section-label mb-1">League</p>
        <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none mb-3">
          {room.name}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-pitch-800 border border-pitch-600 px-3 py-1.5">
            <span className="text-pitch-400 text-xs">Code</span>
            <span className="font-mono text-gold text-sm font-semibold tracking-wider">{room.id}</span>
          </div>
          <span className="text-xs text-pitch-300">
            {leaderboard.length} player{leaderboard.length !== 1 ? 's' : ''}
          </span>
          {!isMember && (
            <div className="ml-auto">
              <JoinLeagueButton leagueId={params.leagueId} isLoggedIn={!!session.playerId} />
            </div>
          )}
        </div>
      </div>

      <div className="anim-fade-up anim-delay-1">
        <p className="section-label mb-3">Leaderboard</p>
        <Leaderboard rows={leaderboard} currentUsername={session.username} leagueId={params.leagueId} />
      </div>
    </div>
  )
}
