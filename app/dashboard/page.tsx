import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'
import Link from 'next/link'
import { CreateJoinRoom } from './CreateJoinRoom'

const DEADLINE = new Date('2026-06-15T04:59:00Z')

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.playerId) redirect('/')

  const supabase = createServerClient()

  const { data: bracket } = await supabase
    .from('brackets')
    .select('id, submitted_at, locked')
    .eq('player_id', session.playerId)
    .single()

  const groupComplete = bracket
    ? (await supabase.from('group_predictions').select('id', { count: 'exact' }).eq('bracket_id', bracket.id)).count === 36
    : false

  const koComplete = bracket
    ? (await supabase.from('knockout_predictions').select('id', { count: 'exact' }).eq('bracket_id', bracket.id)).count === 32
    : false

  const { data: memberships } = await supabase
    .from('room_members')
    .select('room_id, rooms(id, name)')
    .eq('player_id', session.playerId)

  const { data: actualResults } = await supabase.from('actual_results').select('*')

  const roomsWithRank = await Promise.all(
    (memberships ?? []).map(async m => {
      const room = m.rooms as any
      const { data: members } = await supabase
        .from('room_members')
        .select('player_id, players(id, username)')
        .eq('room_id', room.id)

      const scores = await Promise.all(
        (members ?? []).map(async member => {
          const p = member.players as any
          const { data: b } = await supabase.from('brackets').select('id').eq('player_id', p.id).single()
          if (!b) return { username: p.username, total: 0 }
          const [{ data: gp }, { data: kp }] = await Promise.all([
            supabase.from('group_predictions').select('*').eq('bracket_id', b.id),
            supabase.from('knockout_predictions').select('*').eq('bracket_id', b.id),
          ])
          return { username: p.username, ...computeScore(gp ?? [], kp ?? [], actualResults ?? []) }
        })
      )
      scores.sort((a, b) => b.total - a.total)
      const rank = scores.findIndex(s => s.username === session.username) + 1
      return { id: room.id, name: room.name, playerCount: scores.length, rank }
    })
  )

  const isPastDeadline = new Date() > DEADLINE
  const submitted = !!bracket?.submitted_at

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Hey, {session.username} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">FIFA World Cup 2026 Predictor</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-sm text-slate-500 hover:text-slate-300 bg-slate-800 px-3 py-1.5 rounded">
            Log out
          </button>
        </form>
      </div>

      <div className={`rounded-xl border p-4 mb-6 ${submitted ? 'border-green-700 bg-green-950/20' : 'border-yellow-700 bg-yellow-950/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-300">My Bracket</span>
          {submitted
            ? <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Submitted ✓</span>
            : <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">⚠ Not submitted</span>
          }
        </div>
        {!isPastDeadline && (
          <p className="text-xs text-slate-500 mb-3">Deadline: 14 Jun 2026 23:59</p>
        )}
        <div className="flex gap-2 text-xs text-slate-400 mb-4">
          <span>{groupComplete ? '✅' : '⬜'} Group Stage</span>
          <span>{koComplete ? '✅' : '⬜'} Knockouts</span>
        </div>
        <div className="flex gap-2">
          <Link href="/bracket" className="flex-1 text-center rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
            {isPastDeadline || submitted ? 'View bracket' : 'Edit bracket'}
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">My Rooms</h2>
        <div className="flex flex-col gap-2">
          {roomsWithRank.map(room => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-3 hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-slate-200">{room.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Code: <span className="font-mono text-yellow-400">{room.id}</span>
                  {' · '}{room.playerCount} players
                  {room.rank > 0 && ` · You're #${room.rank}`}
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </Link>
          ))}
          {roomsWithRank.length === 0 && (
            <p className="text-sm text-slate-500">No rooms yet — create one or enter a code below.</p>
          )}
        </div>
      </div>

      <CreateJoinRoom />
    </div>
  )
}
