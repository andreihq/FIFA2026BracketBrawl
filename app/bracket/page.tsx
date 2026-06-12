'use client'
import { useState, useEffect, useCallback } from 'react'
import { GROUP_CODES } from '@/data/groups'
import { MATCH_IDS } from '@/data/bracket'
import { GroupStageEditor } from '@/components/GroupStageEditor'
import { KnockoutBracket } from '@/components/KnockoutBracket'

const DEADLINE = new Date('2026-06-15T04:59:00Z')

type Tab = 'groups' | 'knockouts'

export default function BracketPage() {
  const [tab, setTab] = useState<Tab>('groups')
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>({})
  const [koPicks, setKoPicks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const isPastDeadline = new Date() > DEADLINE
  const isDisabled = locked || isPastDeadline

  useEffect(() => {
    fetch('/api/brackets')
      .then(r => r.json())
      .then(data => {
        setSubmitted(!!data.bracket?.submitted_at)
        setLocked(!!data.bracket?.locked)

        const rankings: Record<string, string[]> = {}
        for (const group of GROUP_CODES) {
          const preds = (data.groupPredictions as any[])
            .filter((p: any) => p.group_code === group)
            .sort((a: any, b: any) => a.predicted_pos - b.predicted_pos)
          rankings[group] = preds.map((p: any) => p.team_code)
        }
        setGroupRankings(rankings)

        const picks: Record<string, string> = {}
        for (const p of data.knockoutPredictions as any[]) {
          picks[p.match_id] = p.predicted_winner
        }
        setKoPicks(picks)
        setLoading(false)
      })
  }, [])

  const saveDraft = useCallback(async () => {
    setSaving(true)
    const groupPredictions = Object.entries(groupRankings).flatMap(([group_code, order]) =>
      order.map((team_code, i) => ({ group_code, team_code, predicted_pos: i + 1 }))
    )
    const knockoutPredictions = Object.entries(koPicks).map(([match_id, predicted_winner]) => ({
      match_id,
      predicted_winner,
    }))
    const res = await fetch('/api/brackets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupPredictions, knockoutPredictions }),
    })
    setSaveMsg(res.ok ? 'Saved ✓' : 'Save failed')
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }, [groupRankings, koPicks])

  async function handleSubmit() {
    await saveDraft()
    const res = await fetch('/api/brackets/submit', { method: 'POST' })
    if (res.ok) setSubmitted(true)
  }

  const groupsComplete = GROUP_CODES.every(g => (groupRankings[g]?.length ?? 0) >= 4)
  const koComplete = MATCH_IDS.every(id => !!koPicks[id])

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bracket</h1>
      </div>

      <div className="flex gap-1 mb-6">
        {(['groups', 'knockouts'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {t === 'groups' ? 'Group Stage' : 'Knockouts'}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GROUP_CODES.map(g => (
            <GroupStageEditor
              key={g}
              groupCode={g}
              order={groupRankings[g] ?? []}
              onChange={(code, order) => setGroupRankings(prev => ({ ...prev, [code]: order }))}
              disabled={isDisabled}
            />
          ))}
        </div>
      )}

      {tab === 'knockouts' && (
        <div>
          {!groupsComplete && (
            <div className="mb-4 rounded bg-yellow-900/30 border border-yellow-700 px-4 py-3 text-sm text-yellow-300">
              Complete the Group Stage first — knockout slots are populated from your group predictions.
            </div>
          )}
          <KnockoutBracket
            groupRankings={groupRankings}
            picks={koPicks}
            onPick={(matchId, teamCode) => setKoPicks(prev => ({ ...prev, [matchId]: teamCode }))}
            disabled={isDisabled || !groupsComplete}
          />
        </div>
      )}

      {!isDisabled && (
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-800">
          {saveMsg && <span className="text-sm text-green-400">{saveMsg}</span>}
          <button
            onClick={saveDraft}
            disabled={saving}
            className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!groupsComplete || !koComplete}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              Submit bracket
            </button>
          )}
        </div>
      )}
      {submitted && <p className="mt-8 text-center text-sm text-green-400 font-medium">Submitted ✓</p>}
      {isDisabled && !submitted && <p className="mt-8 text-center text-sm text-yellow-400">Deadline passed</p>}
    </div>
  )
}
