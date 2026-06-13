'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { GroupPrediction, KnockoutPrediction } from '@/types'
import { GROUP_CODES, GROUPS } from '@/data/groups'
import { KNOCKOUT_MATCHES, buildPicks } from '@/data/bracket'
import { BracketEditor } from '@/components/BracketEditor'
import { DeadlineCountdown } from '@/components/DeadlineCountdown'
import { ShareBracketModal } from '@/components/ShareBracketModal'
import { Modal } from '@/components/Modal'

export default function BracketPage() {
  const router = useRouter()
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>({})
  const [qualifiers, setQualifiers] = useState<Record<string, string>>({})
  const [winners, setWinners] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<'save' | 'submit' | null>(null)
  const [resetting, setResetting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [hasBracket, setHasBracket] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [username, setUsername] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [bracketTab, setBracketTab] = useState<'groups' | 'knockouts'>('groups')
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
        setHasBracket(!!data.bracket)
        setSubmitted(!!data.bracket?.submitted_at)
        setLocked(!!data.bracket?.locked)
        setUsername(data.username ?? '')

        const rankings: Record<string, string[]> = {}
        for (const group of GROUP_CODES) {
          const preds = (data.groupPredictions as GroupPrediction[])
            .filter((p: GroupPrediction) => p.group_code === group)
            .sort((a: GroupPrediction, b: GroupPrediction) => a.predicted_pos - b.predicted_pos)
          rankings[group] = preds.length > 0
            ? preds.map((p) => p.team_code)
            : GROUPS[group] ?? []
        }
        setGroupRankings(rankings)

        const q: Record<string, string> = {}
        const w: Record<string, string> = {}
        for (const p of data.knockoutPredictions as KnockoutPrediction[]) {
          if (p.match_id.endsWith(':qualifier')) q[p.match_id.replace(':qualifier', '')] = p.predicted_winner
          else w[p.match_id] = p.predicted_winner
        }
        setQualifiers(q)
        setWinners(w)
        setLoading(false)
      })
  }, [])

  const bracketState = !hasBracket ? 'empty' : !submitted ? 'draft' : isDisabled ? 'locked' : 'active'
  const badgeStyles = {
    empty:  'bg-gold/10 border-gold/20 text-gold',
    draft:  'bg-pitch-700/50 border-pitch-600/60 text-pitch-300',
    active: 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]',
    locked: 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]',
  }[bracketState]
  const badgeLabel = { empty: 'Not Submitted', draft: 'Draft', active: 'Submitted', locked: 'Locked ✓' }[bracketState]

  const groupsComplete = GROUP_CODES.every(g => (groupRankings[g]?.length ?? 0) >= 4)
  const koComplete = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
    && KNOCKOUT_MATCHES
      .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd'))
      .every(m => !!picks[m.id]?.teamB)

  const handlePick = useCallback((matchId: string, field: 'teamB' | 'winner', teamCode: string) => {
    if (field === 'teamB') setQualifiers(prev => ({ ...prev, [matchId]: teamCode }))
    else setWinners(prev => ({ ...prev, [matchId]: teamCode }))
  }, [])

  const buildPayload = useCallback((doSubmit: boolean) => {
    const groupPredictions = Object.entries(groupRankings).flatMap(([group_code, order]) =>
      order.map((team_code, i) => ({ group_code, team_code, predicted_pos: i + 1 }))
    )
    const knockoutPredictions = [
      ...Object.entries(winners).map(([match_id, predicted_winner]) => ({ match_id, predicted_winner })),
      ...Object.entries(qualifiers).map(([match_id, predicted_winner]) => ({ match_id: match_id + ':qualifier', predicted_winner })),
    ]
    return { groupPredictions, knockoutPredictions, submit: doSubmit }
  }, [groupRankings, winners, qualifiers])

  const saveDraft = useCallback(async () => {
    setSavingAction('save')
    const res = await fetch('/api/brackets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(false)),
    })
    if (res.ok) setHasBracket(true)
    setSaveMsg(res.ok ? 'Saved ✓' : 'Save failed')
    setSavingAction(null)
    setTimeout(() => setSaveMsg(''), 3000)
  }, [buildPayload])

  const submitBracket = useCallback(async () => {
    if (!groupsComplete || !koComplete) {
      setShowValidation(true)
      if (!koComplete) setBracketTab('knockouts')
      return
    }
    setShowValidation(false)
    setSavingAction('submit')
    const res = await fetch('/api/brackets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(true)),
    })
    if (res.ok) { setHasBracket(true); setSubmitted(true) }
    setSaveMsg(res.ok ? 'Submitted ✓' : 'Submit failed')
    setSavingAction(null)
    setTimeout(() => setSaveMsg(''), 3000)
  }, [buildPayload, groupsComplete, koComplete])

  const resetBracket = useCallback(async () => {
    setResetting(true)
    const res = await fetch('/api/brackets', { method: 'DELETE' })
    if (res.ok) {
      const defaultRankings: Record<string, string[]> = {}
      for (const group of GROUP_CODES) {
        defaultRankings[group] = GROUPS[group] ?? []
      }
      setGroupRankings(defaultRankings)
      setQualifiers({})
      setWinners({})
      setHasBracket(false)
      setSubmitted(false)
      router.refresh()
    }
    setResetting(false)
    setShowReset(false)
  }, [router])

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

      {showReset && (
        <Modal title="Reset Bracket?" onClose={() => setShowReset(false)}>
          <p className="text-sm text-pitch-200 mb-6">
            This will permanently clear all your picks and un-submit your bracket. You can fill it in again before the deadline.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowReset(false)}
              className="btn-ghost px-4 py-2 text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={resetBracket}
              disabled={resetting}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {resetting ? 'Resetting…' : 'Reset Bracket'}
            </button>
          </div>
        </Modal>
      )}

      {/* Page header */}
      <div className="anim-fade-up mb-6 pt-2 px-5">
        <p className="section-label mb-1">Bracket</p>
        <div className="flex items-center justify-between mb-2 gap-3">
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider text-[#EBF0FF] leading-none">My Predictions</h1>
          {submitted && (
            <button
              onClick={() => setShowShare(true)}
              className="btn-ghost flex-shrink-0 gap-2 py-2 text-xs uppercase tracking-widest"
            >
              <svg width="14" height="15" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <circle cx="2.5" cy="9" r="2"/>
                <circle cx="13.5" cy="2.5" r="2"/>
                <circle cx="13.5" cy="15.5" r="2"/>
                <line x1="4.3" y1="8.2" x2="11.7" y2="3.8"/>
                <line x1="4.3" y1="9.8" x2="11.7" y2="14.2"/>
              </svg>
              <span className="hidden min-[351px]:inline">Share</span>
            </button>
          )}
        </div>
        <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold mb-3 ${badgeStyles}`}>
          {badgeLabel}
        </span>
        {deadline && !isDisabled && <div><DeadlineCountdown deadline={deadline} /></div>}

        {/* How to play */}
        <div className="mt-6">
          <button
            onClick={() => setShowInstructions(s => !s)}
            className="inline-flex items-center gap-1.5 text-sm text-[#EBF0FF] hover:text-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 7.5v4M8 5.5h.01"/>
            </svg>
            How to fill your bracket
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M2 3.5l3 3 3-3"/>
            </svg>
          </button>

          {showInstructions && (
            <div className="mt-3 rounded-xl border border-pitch-700 bg-pitch-900/60 p-5 space-y-6 text-sm text-pitch-200">

              {/* Step 1 */}
              <div>
                <p className="section-label mb-2">① Group Stage</p>
                <p className="leading-relaxed">
                  Drag and drop the teams within each group to rank them <span className="text-[#EBF0FF] font-medium">1st through 4th</span> in the order you predict they&apos;ll finish. The <span className="text-[#EBF0FF] font-medium">top 2</span> from each group advance to the Round of 32 automatically.
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <p className="section-label mb-2">② 3rd-Place Wildcards</p>
                <p className="leading-relaxed mb-4">
                  In the 48-team format, <span className="text-[#EBF0FF] font-medium">8 of the 12 third-place teams</span> also advance as wildcards. Each Round of 32 slot draws from a fixed set of eligible groups — you choose which 3rd-place team fills it. Each team can only fill one slot; once picked, it disappears from the other dropdowns.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    ['M74', 'Group E Winner', 'A B C D F'],
                    ['M77', 'Group I Winner', 'C D F G H'],
                    ['M79', 'Group A Winner', 'C E F H I'],
                    ['M80', 'Group L Winner', 'E H I J K'],
                    ['M81', 'Group D Winner', 'B E F I J'],
                    ['M82', 'Group G Winner', 'A E H I J'],
                    ['M85', 'Group B Winner', 'E F G I J'],
                    ['M87', 'Group K Winner', 'D E I J L'],
                  ] as [string, string, string][]).map(([id, opp, groups]) => (
                    <div key={id} className="rounded-lg bg-pitch-800 border border-pitch-600 px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#EBF0FF] bg-pitch-600 rounded px-1.5 py-0.5">{id}</span>
                        <span className="text-pitch-200 text-xs">{opp}</span>
                        <span className="text-pitch-300 text-xs">vs</span>
                        <span className="text-[#EBF0FF] font-semibold text-xs">Best 3rd Place of</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {groups.split(' ').map(g => (
                          <span key={g} className="rounded-md px-2 py-0.5 bg-pitch-500 border border-pitch-400 text-[11px] font-bold text-[#EBF0FF]">Group {g}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <p className="section-label mb-2">③ Knockout Rounds</p>
                <p className="leading-relaxed">
                  Switch to the <span className="text-[#EBF0FF] font-medium">Knockouts tab</span> and pick the winner of every match — Round of 32, Quarterfinals, Semifinals, and the Final. Don&apos;t forget to pick the <span className="text-[#EBF0FF] font-medium">3rd Place</span> match too.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>

      <div className="anim-fade-up anim-delay-1 px-5">
        <BracketEditor
          groupRankings={groupRankings}
          qualifiers={qualifiers}
          winners={winners}
          onGroupChange={(code, order) => setGroupRankings(prev => ({ ...prev, [code]: order }))}
          onPick={handlePick}
          disabled={isDisabled}
          showValidation={showValidation}
          tab={bracketTab}
          onTabChange={setBracketTab}
        />
      </div>

      {!isDisabled && (
        <div className="flex items-center justify-between mt-10 pt-5 border-t border-pitch-700 px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={submitBracket}
              disabled={savingAction !== null}
              className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
              style={{ background: '#34D399', color: '#07090F' }}
            >
              {savingAction === 'submit' ? 'Submitting…' : 'Submit Bracket'}
            </button>
            {saveMsg && (
              <span className={`text-sm font-medium ${saveMsg.includes('✓') ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                {saveMsg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveDraft}
              disabled={savingAction !== null}
              className="btn-ghost px-5 py-2.5 text-xs uppercase tracking-widest"
            >
              {savingAction === 'save' ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setShowReset(true)}
              disabled={savingAction !== null}
              className="btn-ghost px-5 py-2.5 text-xs uppercase tracking-widest"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
