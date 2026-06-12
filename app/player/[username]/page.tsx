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

  const backHref = searchParams.from ? `/room/${searchParams.from}` : '/dashboard'
  const tab = (searchParams.tab === 'knockouts' ? 'knockouts' : 'groups') as 'groups' | 'knockouts'

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href={backHref} className="text-slate-500 hover:text-slate-300 text-sm">← Back</Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{player.username}&apos;s bracket</h1>
      {!bracket?.submitted_at && (
        <p className="text-yellow-400 text-sm mb-4">This player hasn&apos;t submitted their bracket yet.</p>
      )}
      {bracket && (
        <div>
          <div className="flex gap-1 mb-6">
            <a
              href={`/player/${params.username}?tab=groups${searchParams.from ? `&from=${searchParams.from}` : ''}`}
              className={`px-4 py-2 rounded text-sm font-medium ${tab === 'groups' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Group Stage
            </a>
            <a
              href={`/player/${params.username}?tab=knockouts${searchParams.from ? `&from=${searchParams.from}` : ''}`}
              className={`px-4 py-2 rounded text-sm font-medium ${tab === 'knockouts' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Knockouts
            </a>
          </div>
          <BracketView
            groupPredictions={groupPredictions ?? []}
            knockoutPredictions={knockoutPredictions ?? []}
            tab={tab}
          />
        </div>
      )}
    </div>
  )
}
