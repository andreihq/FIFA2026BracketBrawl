import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'
import Link from 'next/link'
import { CreateJoinLeague } from './CreateJoinLeague'
import { DeadlineCountdown } from './DeadlineCountdown'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.playerId) redirect('/')

  const supabase = createServerClient()

  const { data: deadlineSetting } = await supabase
    .from('settings').select('value').eq('key', 'deadline').single()
  const deadline = deadlineSetting?.value ?? '2026-06-15T04:59:00.000Z'

  const { data: bracket } = await supabase
    .from('brackets')
    .select('id, submitted_at, locked')
    .eq('player_id', session.playerId)
    .single()

  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id, leagues(id, name)')
    .eq('player_id', session.playerId)

  const { data: actualResults } = await supabase.from('actual_results').select('*')

  const leaguesWithRank = await Promise.all(
    (memberships ?? []).map(async m => {
      const league = m.leagues as any
      const { data: members } = await supabase
        .from('league_members')
        .select('player_id, players(id, username)')
        .eq('league_id', league.id)

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
      return { id: league.id, name: league.name, playerCount: scores.length, rank }
    })
  )

  const isPastDeadline = new Date() > new Date(deadline)
  const bracketCreated = !!bracket
  const isLocked = isPastDeadline || !!bracket?.locked

  const bracketState = !bracketCreated ? 'empty' : isLocked ? 'locked' : 'active'
  const bracketStyles = {
    empty:  { card: 'border-pitch-500/40 bg-pitch-900/60', badge: 'bg-pitch-700 border-pitch-500 text-pitch-300' },
    active: { card: 'border-gold/20 bg-gold/5',            badge: 'bg-gold/10 border-gold/20 text-gold' },
    locked: { card: 'border-[#34D399]/25 bg-[#34D399]/5', badge: 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]' },
  }[bracketState]
  const bracketCopy = {
    empty:  { heading: 'Your bracket awaits',  body: 'Rank all 12 groups and pick knockout winners all the way to the champion. Submit before the deadline to compete.', badge: 'Not started', btn: 'Create My Bracket' },
    active: { heading: 'Bracket in progress',  body: 'Keep picking and submit before the deadline to lock in your predictions.',                                          badge: 'In Progress',  btn: 'Edit My Bracket' },
    locked: { heading: 'Bracket locked in',    body: 'Your predictions are set. Check back as results come in to see how you rank.',                                      badge: 'Locked ✓',    btn: 'View My Bracket' },
  }[bracketState]

  return (
    <div className="min-h-screen p-5 max-w-xl mx-auto">

      {/* Greeting */}
      <div className="anim-fade-up pt-2 mb-8">
        <p className="section-label mb-1">Dashboard</p>
        <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">
          {session.username}
        </h1>
      </div>

      {/* My Bracket */}
      <div className="anim-fade-up anim-delay-1 mb-5">
        <p className="section-label mb-3">My Bracket</p>

        <div className={`card p-5 ${bracketStyles.card}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-[#EBF0FF] mb-1">{bracketCopy.heading}</p>
              <p className="text-xs text-pitch-300 leading-relaxed">{bracketCopy.body}</p>
            </div>
            <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${bracketStyles.badge}`}>
              {bracketCopy.badge}
            </span>
          </div>
          {bracketState !== 'locked' && !isPastDeadline && <DeadlineCountdown deadline={deadline} />}
          <Link
            href="/bracket"
            className={`w-full justify-center text-xs uppercase tracking-widest py-2.5 ${bracketState === 'empty' ? 'btn-gold' : 'btn-ghost'}`}
          >
            {bracketCopy.btn}
          </Link>
        </div>
      </div>

      {/* My Leagues */}
      <div className="anim-fade-up anim-delay-2 mb-5">
        <p className="section-label mb-3">My Leagues</p>
        <div className="flex flex-col gap-2">
          {leaguesWithRank.map((league, i) => (
            <Link
              key={league.id}
              href={`/league/${league.id}`}
              className="card card-lift flex items-center gap-4 px-4 py-3.5"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-pitch-800 border border-pitch-600">
                <span className="font-display text-base text-pitch-300 leading-none">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[#EBF0FF] truncate">{league.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-pitch-300">
                  <span className="font-mono text-gold text-[11px] tracking-wider">{league.id}</span>
                  <span className="text-pitch-500">·</span>
                  <span>{league.playerCount} players</span>
                  {league.rank > 0 && (
                    <>
                      <span className="text-pitch-500">·</span>
                      <span className="font-medium text-[#EBF0FF]">#{league.rank}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-pitch-400 text-lg">›</span>
            </Link>
          ))}
          {leaguesWithRank.length === 0 && (
            <div className="card px-4 py-6 text-center">
              <p className="text-sm text-pitch-300">No leagues yet</p>
              <p className="text-xs text-pitch-400 mt-1">Create one or enter a league code below</p>
            </div>
          )}
        </div>
      </div>

      <div className="anim-fade-up anim-delay-3">
        <CreateJoinLeague />
      </div>
    </div>
  )
}
