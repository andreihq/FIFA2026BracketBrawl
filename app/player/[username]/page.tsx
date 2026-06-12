import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { BracketView } from '@/components/BracketView'
import Link from 'next/link'

export default async function PlayerPage({ params, searchParams }: {
  params: { username: string }
  searchParams: { from?: string; tab?: string }
}) {
  const session = await getSession()
  if (!session.playerId) redirect('/')

  const supabase = createServerClient()
  const { data: player } = await supabase
    .from('players').select('id, username').eq('username', params.username).single()

  if (!player) redirect('/dashboard')

  const { data: bracket } = await supabase
    .from('brackets').select('id, submitted_at').eq('player_id', player.id).single()

  const [{ data: groupPredictions }, { data: knockoutPredictions }] = bracket
    ? await Promise.all([
        supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
      ])
    : [{ data: [] }, { data: [] }]

  const backHref = searchParams.from ? `/league/${searchParams.from}` : '/dashboard'
  const tab = (searchParams.tab === 'knockouts' ? 'knockouts' : 'groups') as 'groups' | 'knockouts'

  return (
    <div className="min-h-screen p-5 max-w-6xl mx-auto">

      <div className="anim-fade-up pt-2 mb-7">
        <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-pitch-300 hover:text-[#EBF0FF] transition-colors mb-4 uppercase tracking-wider">
          ← Back
        </Link>
        <p className="section-label mb-1">Player Bracket</p>
        <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">
          {player.username}
        </h1>
        {!bracket?.submitted_at && (
          <p className="mt-2 text-sm font-medium text-gold">
            This player hasn&apos;t submitted their bracket yet.
          </p>
        )}
      </div>

      {bracket && (
        <div>
          <div className="anim-fade-up anim-delay-1 flex gap-1.5 mb-6">
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

          <div className="anim-fade-up anim-delay-2">
            <BracketView
              groupPredictions={groupPredictions ?? []}
              knockoutPredictions={knockoutPredictions ?? []}
              tab={tab}
            />
          </div>
        </div>
      )}
    </div>
  )
}
