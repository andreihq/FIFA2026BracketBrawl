'use client'
import { useState, useEffect, useCallback } from 'react'
import { GROUP_CODES, GROUPS } from '@/data/groups'
import { MATCH_IDS, THIRD_PLACE_SLOT_MATCH_IDS, KNOCKOUT_MATCHES, resolveTeam } from '@/data/bracket'
import { GroupStageEditor } from '@/components/GroupStageEditor'
import { KnockoutBracket } from '@/components/KnockoutBracket'

type Tab = 'groups' | 'knockouts'

export default function BracketPage() {
  const [tab, setTab] = useState<Tab>('groups')
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>({})
  const [koPicks, setKoPicks] = useState<Record<string, string>>({})
  const [thirdPicks, setThirdPicks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [deadline, setDeadline] = useState<string | null>(null)

  useEffect(() => {
    const ko = { ...koPicks }
    const third = { ...thirdPicks }
    let koChanged = false
    let thirdChanged = false

    for (const match of KNOCKOUT_MATCHES.filter(m => m.slotB.startsWith('Best 3rd'))) {
      const picked = third[match.id]
      if (!picked) continue
      const groups = match.slotB.replace('Best 3rd ', '').split('')
      const eligible = groups.map(g => groupRankings[g]?.[2]).filter(Boolean) as string[]
      if (!eligible.includes(picked)) { delete third[match.id]; thirdChanged = true }
    }

    for (const match of KNOCKOUT_MATCHES) {
      const picked = ko[match.id]
      if (!picked) continue
      const teamA = resolveTeam(match.slotA, match.id, groupRankings, ko, third)
      const teamB = resolveTeam(match.slotB, match.id, groupRankings, ko, third)
      if (picked !== teamA && picked !== teamB) { delete ko[match.id]; koChanged = true }
    }

    if (koChanged) setKoPicks(ko)
    if (thirdChanged) setThirdPicks(third)
  }, [groupRankings]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPastDeadline = deadline ? new Date() > new Date(deadline) : false
  const isDisabled = locked || isPastDeadline

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => setDeadline(d.deadline))
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
          rankings[group] = preds.length > 0
            ? preds.map((p: any) => p.team_code)
            : GROUPS[group] ?? []
        }
        setGroupRankings(rankings)

        const ko: Record<string, string> = {}
        const third: Record<string, string> = {}
        for (const p of data.knockoutPredictions as any[]) {
          if (p.match_id.endsWith(':3rd')) {
            third[p.match_id.slice(0, -4)] = p.predicted_winner
          } else {
            ko[p.match_id] = p.predicted_winner
          }
        }
        setKoPicks(ko)
        setThirdPicks(third)
        setLoading(false)
      })
  }, [])

  const saveDraft = useCallback(async () => {
    setSaving(true)
    const groupPredictions = Object.entries(groupRankings).flatMap(([group_code, order]) =>
      order.map((team_code, i) => ({ group_code, team_code, predicted_pos: i + 1 }))
    )
    const knockoutPredictions = [
      ...Object.entries(koPicks).map(([match_id, predicted_winner]) => ({ match_id, predicted_winner })),
      ...Object.entries(thirdPicks).map(([match_id, predicted_winner]) => ({ match_id: `${match_id}:3rd`, predicted_winner })),
    ]
    const res = await fetch('/api/brackets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupPredictions, knockoutPredictions }),
    })
    setSaveMsg(res.ok ? 'Saved ✓' : 'Save failed')
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }, [groupRankings, koPicks, thirdPicks])

  async function handleSubmit() {
    if (!groupsComplete || !koComplete) {
      setShowValidation(true)
      if (tab !== 'knockouts') setTab('knockouts')
      return
    }
    await saveDraft()
    const res = await fetch('/api/brackets/submit', { method: 'POST' })
    if (res.ok) setSubmitted(true)
  }

  const groupsComplete = GROUP_CODES.every(g => (groupRankings[g]?.length ?? 0) >= 4)
  const koComplete =
    MATCH_IDS.every(id => !!koPicks[id]) &&
    THIRD_PLACE_SLOT_MATCH_IDS.every(id => !!thirdPicks[id])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-pitch-400 text-sm tracking-widest uppercase font-display animate-pulse">
          Loading bracket…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-5 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="anim-fade-up flex items-center justify-between mb-6 pt-2">
        <div>
          <p className="section-label mb-1">Bracket</p>
          <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">My Predictions</h1>
        </div>
        {submitted && (
          <span className="rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 px-3 py-1.5 text-xs font-semibold text-[#34D399]">
            Submitted ✓
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="anim-fade-up anim-delay-1 flex gap-1.5 mb-6">
        {(['groups', 'knockouts'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'tab-active' : 'tab-inactive'}`}
          >
            {t === 'groups' ? 'Group Stage' : 'Knockouts'}
          </button>
        ))}
      </div>

      <div className="anim-fade-up anim-delay-2">
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
          <KnockoutBracket
            groupRankings={groupRankings}
            picks={koPicks}
            onPick={(matchId, teamCode) => setKoPicks(prev => ({ ...prev, [matchId]: teamCode }))}
            thirdPicks={thirdPicks}
            onThirdPick={(matchId, teamCode) => {
              if (!teamCode) {
                setThirdPicks(prev => { const n = { ...prev }; delete n[matchId]; return n })
              } else {
                setThirdPicks(prev => ({ ...prev, [matchId]: teamCode }))
              }
            }}
            disabled={isDisabled}
            showValidation={showValidation}
          />
        )}
      </div>

      {!isDisabled && (
        <div className="flex items-center justify-end gap-3 mt-10 pt-5 border-t border-pitch-700">
          {saveMsg && (
            <span className="text-sm font-medium text-[#34D399]">{saveMsg}</span>
          )}
          <button
            onClick={saveDraft}
            disabled={saving}
            className="btn-ghost px-5 py-2.5 text-xs uppercase tracking-wider"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              className="btn-gold px-5 py-2.5 text-xs uppercase tracking-widest"
            >
              Submit Bracket
            </button>
          )}
        </div>
      )}

      {submitted && (
        <p className="mt-8 text-center text-sm font-medium text-[#34D399]">
          Your bracket has been submitted ✓
        </p>
      )}
      {isDisabled && !submitted && (
        <p className="mt-8 text-center text-sm font-medium text-gold">
          Prediction deadline has passed
        </p>
      )}
    </div>
  )
}
