import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'
import { BracketView } from '@/components/BracketView'
import Link from 'next/link'

export default async function PlayerPage({ params, searchParams }: {
  params: { username: string }
  searchParams: { from?: string; tab?: string }
}) {
  const supabase = createServerClient()
  const { data: player } = await supabase
    .from('players').select('id, username').eq('username', params.username).single()

  if (!player) redirect('/dashboard')

  const { data: bracket } = await supabase
    .from('brackets').select('id, submitted_at').eq('player_id', player.id).single()

  const [{ data: groupPredictions }, { data: knockoutPredictions }, { data: actualResults }] = bracket
    ? await Promise.all([
        supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('actual_results').select('*'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const score = computeScore(groupPredictions ?? [], knockoutPredictions ?? [], actualResults ?? [])

  const backHref = searchParams.from ? `/league/${searchParams.from}` : '/dashboard'
  const tab = (searchParams.tab === 'knockouts' ? 'knockouts' : 'groups') as 'groups' | 'knockouts'

  return (
    <div className="min-h-screen p-5 max-w-6xl mx-auto">

      <div className="anim-fade-up pt-2 mb-7">
        {searchParams.from && (
          <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-pitch-300 hover:text-[#EBF0FF] transition-colors mb-4 uppercase tracking-wider">
            ← Back
          </Link>
        )}
        <p className="section-label mb-1">Player Bracket</p>
        <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">
          {player.username}
        </h1>
      </div>

      {!bracket ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-pitch-300">This user hasn&apos;t submitted their bracket yet.</p>
        </div>
      ) : (
        <div>
          <div className="anim-fade-up anim-delay-1 mb-6">
            <p className="section-label mb-3">Points Scored</p>
            <div className="card grid grid-cols-3">
              <div className="flex flex-col items-center py-4 border-r border-pitch-600">
                <p className="section-label mb-1">Group Stage</p>
                <span className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">{score.groupPoints}</span>
              </div>
              <div className="flex flex-col items-center py-4 border-r border-pitch-600">
                <p className="section-label mb-1">Knockout</p>
                <span className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">{score.knockoutPoints}</span>
              </div>
              <div className="flex flex-col items-center py-4">
                <p className="section-label mb-1">Total</p>
                <span className="font-display text-4xl tracking-wider text-gold leading-none">{score.total}</span>
              </div>
            </div>
          </div>

          <div className="anim-fade-up anim-delay-2 flex gap-1.5 mb-6">
            <a
              href={`/player/${params.username}?tab=groups${searchParams.from ? `&from=${searchParams.from}` : ''}`}
              className={`tab-btn ${tab === 'groups' ? 'tab-active' : 'tab-inactive'}`}
            >
              Group Stage
            </a>
            <a
              href={`/player/${params.username}?tab=knockouts${searchParams.from ? `&from=${searchParams.from}` : ''}`}
              className={`tab-btn ${tab === 'knockouts' ? 'tab-active' : 'tab-inactive'}`}
            >
              Knockouts
            </a>
          </div>

          <div className="anim-fade-up anim-delay-3">
            <BracketView
              groupPredictions={groupPredictions ?? []}
              knockoutPredictions={knockoutPredictions ?? []}
              actualResults={actualResults ?? []}
              tab={tab}
            />
          </div>
        </div>
      )}
    </div>
  )
}
