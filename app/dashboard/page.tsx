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
    <div className="min-h-screen p-5 max-w-xl mx-auto">

      {/* Page header */}
      <div className="anim-fade-up flex items-center justify-between mb-8 pt-2">
        <div>
          <p className="section-label mb-1">Dashboard</p>
          <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">
            {session.username}
          </h1>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="btn-ghost text-xs px-3 py-2">
            Log out
          </button>
        </form>
      </div>

      {/* Bracket status card */}
      <div className={`anim-fade-up anim-delay-1 card p-5 mb-5 ${
        submitted
          ? 'border-[#34D399]/25 bg-[#34D399]/5'
          : 'border-gold/20 bg-gold/5'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="section-label mb-1">My Bracket</p>
            <p className="text-sm text-[#EBF0FF] font-medium">
              {submitted ? 'Bracket locked in' : 'Complete your bracket'}
            </p>
          </div>
          {submitted ? (
            <span className="rounded-lg bg-[#34D399]/15 border border-[#34D399]/25 px-2.5 py-1 text-xs font-semibold text-[#34D399]">
              Submitted ✓
            </span>
          ) : (
            <span className="rounded-lg bg-gold/10 border border-gold/20 px-2.5 py-1 text-xs font-semibold text-gold">
              Pending
            </span>
          )}
        </div>

        <div className="flex gap-4 mb-4">
          {[
            { label: 'Group Stage', done: groupComplete },
            { label: 'Knockouts', done: koComplete },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${done ? 'bg-[#34D399]' : 'bg-pitch-500'}`} />
              <span className={`text-xs font-medium ${done ? 'text-[#34D399]' : 'text-pitch-300'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {!isPastDeadline && !submitted && (
          <p className="mb-4 text-xs text-pitch-300">
            Deadline: <span className="font-medium text-[#EBF0FF]">14 Jun 2026 · 23:59</span>
          </p>
        )}

        <Link
          href="/bracket"
          className="btn-ghost w-full justify-center text-xs uppercase tracking-wider py-2.5"
        >
          {isPastDeadline || submitted ? 'View Bracket' : 'Edit Bracket'}
        </Link>
      </div>

      {/* Rooms */}
      <div className="anim-fade-up anim-delay-2 mb-5">
        <p className="section-label mb-3">My Rooms</p>
        <div className="flex flex-col gap-2">
          {roomsWithRank.map((room, i) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="card card-lift flex items-center gap-4 px-4 py-3.5"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-pitch-800 border border-pitch-600">
                <span className="font-display text-base text-pitch-300 leading-none">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[#EBF0FF] truncate">{room.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-pitch-300">
                  <span className="font-mono text-gold text-[11px] tracking-wider">{room.id}</span>
                  <span className="text-pitch-500">·</span>
                  <span>{room.playerCount} players</span>
                  {room.rank > 0 && (
                    <>
                      <span className="text-pitch-500">·</span>
                      <span className="font-medium text-[#EBF0FF]">#{room.rank}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-pitch-400 text-lg">›</span>
            </Link>
          ))}
          {roomsWithRank.length === 0 && (
            <div className="card px-4 py-6 text-center">
              <p className="text-sm text-pitch-300">No rooms yet</p>
              <p className="text-xs text-pitch-400 mt-1">Create one or enter a room code below</p>
            </div>
          )}
        </div>
      </div>

      <div className="anim-fade-up anim-delay-3">
        <CreateJoinRoom />
      </div>
    </div>
  )
}
