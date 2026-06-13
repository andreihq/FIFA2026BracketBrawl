'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { GROUP_CODES, GROUPS } from '@/data/groups'
import { KNOCKOUT_MATCHES, buildPicks } from '@/data/bracket'
import { GroupStageEditor } from '@/components/GroupStageEditor'
import { KnockoutBracket } from '@/components/KnockoutBracket'
import { DeadlineCountdown } from '@/components/DeadlineCountdown'
import { ShareBracketModal } from '@/components/ShareBracketModal'

type Tab = 'groups' | 'knockouts'

export default function BracketPage() {
  const [tab, setTab] = useState<Tab>('groups')
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>({})
  const [qualifiers, setQualifiers] = useState<Record<string, string>>({})
  const [winners, setWinners] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [username, setUsername] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [deadline, setDeadline] = useState<string | null>(null)

  const picks = useMemo(
    () => buildPicks(groupRankings, qualifiers, winners),
    [groupRankings, qualifiers, winners]
  )

  const isPastDeadline = deadline ? new Date() > new Date(deadline) : false
  const isDisabled = locked || isPastDeadline

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => setDeadline(d.deadline))
    fetch('/api/brackets')
      .then(r => r.json())
      .then(data => {
        setSubmitted(!!data.bracket)
        setLocked(!!data.bracket?.locked)
        setUsername(data.username ?? '')

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

        const q: Record<string, string> = {}
        const w: Record<string, string> = {}
        for (const p of data.knockoutPredictions as any[]) {
          if (p.match_id.endsWith(':qualifier')) q[p.match_id.replace(':qualifier', '')] = p.predicted_winner
          else w[p.match_id] = p.predicted_winner
        }
        setQualifiers(q)
        setWinners(w)
        setLoading(false)
      })
  }, [])

  const bracketState = !submitted ? 'empty' : isDisabled ? 'locked' : 'active'
  const badgeStyles = {
    empty:  'bg-gold/10 border-gold/20 text-gold',
    active: 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]',
    locked: 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]',
  }[bracketState]
  const badgeLabel = { empty: 'Not Submitted', active: 'Submitted', locked: 'Locked ✓' }[bracketState]

  const groupsComplete = GROUP_CODES.every(g => (groupRankings[g]?.length ?? 0) >= 4)
  const koComplete = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
    && KNOCKOUT_MATCHES
      .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd'))
      .every(m => !!picks[m.id]?.teamB)

  const handlePick = useCallback((matchId: string, field: 'teamB' | 'winner', teamCode: string) => {
    if (field === 'teamB') setQualifiers(prev => ({ ...prev, [matchId]: teamCode }))
    else setWinners(prev => ({ ...prev, [matchId]: teamCode }))
  }, [])

  const saveDraft = useCallback(async () => {
    setSaving(true)
    const groupPredictions = Object.entries(groupRankings).flatMap(([group_code, order]) =>
      order.map((team_code, i) => ({ group_code, team_code, predicted_pos: i + 1 }))
    )
    const knockoutPredictions = [
      ...Object.entries(winners).map(([match_id, predicted_winner]) => ({ match_id, predicted_winner })),
      ...Object.entries(qualifiers).map(([match_id, predicted_winner]) => ({ match_id: match_id + ':qualifier', predicted_winner })),
    ]
    const res = await fetch('/api/brackets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupPredictions, knockoutPredictions }),
    })
    setSaveMsg(res.ok ? 'Saved ✓' : 'Save failed')
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }, [groupRankings, winners, qualifiers])

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
    <div className="min-h-screen px-0 py-5 max-w-[1202px] mx-auto">
      {showShare && username && <ShareBracketModal username={username} onClose={() => setShowShare(false)} />}

      {/* Page header */}
      <div className="anim-fade-up mb-12 pt-2 px-5">
        <p className="section-label mb-1">Bracket</p>
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">My Predictions</h1>
          {submitted && (
            <button
              onClick={() => setShowShare(true)}
              className="btn-ghost gap-2 py-2 text-xs uppercase tracking-widest"
            >
              <svg width="14" height="15" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <circle cx="2.5" cy="9" r="2"/>
                <circle cx="13.5" cy="2.5" r="2"/>
                <circle cx="13.5" cy="15.5" r="2"/>
                <line x1="4.3" y1="8.2" x2="11.7" y2="3.8"/>
                <line x1="4.3" y1="9.8" x2="11.7" y2="14.2"/>
              </svg>
              Share
            </button>
          )}
        </div>
        <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold mb-3 ${badgeStyles}`}>
          {badgeLabel}
        </span>
        {deadline && !isDisabled && <div><DeadlineCountdown deadline={deadline} /></div>}
      </div>

      {/* Tabs */}
      <div className="anim-fade-up anim-delay-1 flex gap-1.5 mb-6 px-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-5">
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
            picks={picks}
            onPick={handlePick}
            disabled={isDisabled}
            showValidation={showValidation}
          />
        )}
      </div>

      {!isDisabled && (
        <div className="flex items-center gap-3 mt-10 pt-5 border-t border-pitch-700 px-5">
          {saveMsg && <span className="text-sm font-medium text-[#34D399]">{saveMsg}</span>}
          <button
            onClick={async () => {
              if (!groupsComplete || !koComplete) {
                setShowValidation(true)
                if (tab !== 'knockouts') setTab('knockouts')
                return
              }
              setShowValidation(false)
              await saveDraft()
            }}
            disabled={saving}
            className="btn-gold px-5 py-2.5 text-xs uppercase tracking-widest"
          >
            {saving ? 'Saving…' : 'Save Bracket'}
          </button>
        </div>
      )}
    </div>
  )
}
