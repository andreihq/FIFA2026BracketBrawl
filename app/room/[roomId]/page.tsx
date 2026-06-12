import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'
import { Leaderboard } from '@/components/Leaderboard'

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const session = await getSession()
  if (!session.playerId) redirect('/')

  const supabase = createServerClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('id', params.roomId)
    .single()

  if (!room) redirect('/dashboard')

  const { data: members } = await supabase
    .from('room_members')
    .select('player_id, players(id, username)')
    .eq('room_id', params.roomId)

  const { data: actualResults } = await supabase.from('actual_results').select('*')

  const leaderboard = await Promise.all(
    (members ?? []).map(async member => {
      const player = member.players as any
      const { data: bracket } = await supabase
        .from('brackets').select('id').eq('player_id', player.id).single()
      if (!bracket) return { username: player.username, groupPoints: 0, knockoutPoints: 0, total: 0 }
      const [{ data: gp }, { data: kp }] = await Promise.all([
        supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
      ])
      return { username: player.username, ...computeScore(gp ?? [], kp ?? [], actualResults ?? []) }
    })
  )
  leaderboard.sort((a, b) => b.total - a.total)

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{room.name}</h1>
      <p className="text-slate-500 text-sm mb-6">
        Code: <span className="font-mono text-yellow-400">{room.id}</span>
        {' · '}{leaderboard.length} player{leaderboard.length !== 1 ? 's' : ''}
      </p>
      <Leaderboard rows={leaderboard} currentUsername={session.username} />
    </div>
  )
}
