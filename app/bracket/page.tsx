'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { GroupPrediction, KnockoutPrediction } from '@/types'
import { GROUP_CODES, GROUPS } from '@/data/groups'
import { KNOCKOUT_MATCHES, buildPicks, buildQualifiers } from '@/data/bracket'
import { BracketEditor } from '@/components/BracketEditor'
import { DeadlineCountdown } from '@/components/DeadlineCountdown'
import { ShareBracketModal } from '@/components/ShareBracketModal'
import { Modal } from '@/components/Modal'

export default function BracketPage() {
  const router = useRouter()
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>({})
  const [advancingThirds, setAdvancingThirds] = useState<Set<string>>(new Set())
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
  const [submitAttempt, setSubmitAttempt] = useState(0)
  const [bracketTab, setBracketTab] = useState<'groups' | 'knockouts'>('groups')
  const [deadline, setDeadline] = useState<string | null>(null)

  const qualifiers = useMemo(
    () => buildQualifiers(groupRankings, advancingThirds),
    [groupRankings, advancingThirds]
  )
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

        const advancing = new Set<string>()
        const w: Record<string, string> = {}
        for (const p of data.knockoutPredictions as KnockoutPrediction[]) {
          if (p.match_id.startsWith('WILDCARD_')) advancing.add(p.predicted_winner)
          else w[p.match_id] = p.predicted_winner
        }
        setAdvancingThirds(advancing)
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
  const thirdsComplete = advancingThirds.size === 8
  const koComplete = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)

  const handlePick = useCallback((matchId: string, winner: string) => {
    setWinners(prev => ({ ...prev, [matchId]: winner }))
  }, [])

  const handleAdvancingThirdsChange = useCallback((code: string, val: boolean) => {
    setAdvancingThirds(prev => {
      const next = new Set(prev)
      if (val) next.add(code)
      else next.delete(code)
      return next
    })
  }, [])

  const buildPayload = useCallback((doSubmit: boolean) => {
    const groupPredictions = Object.entries(groupRankings).flatMap(([group_code, order]) =>
      order.map((team_code, i) => ({ group_code, team_code, predicted_pos: i + 1 }))
    )
    const knockoutPredictions = [
      ...Object.entries(winners).map(([match_id, predicted_winner]) => ({ match_id, predicted_winner })),
      ...Array.from(advancingThirds).map((g, i) => ({ match_id: `WILDCARD_${i + 1}`, predicted_winner: g })),
    ]
    return { groupPredictions, knockoutPredictions, submit: doSubmit }
  }, [groupRankings, winners, advancingThirds])

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
    if (!groupsComplete || !thirdsComplete || !koComplete) {
      setShowValidation(true)
      setSubmitAttempt(n => n + 1)
      if (!thirdsComplete) setBracketTab('groups')
      else if (!koComplete) setBracketTab('knockouts')
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
  }, [buildPayload, groupsComplete, thirdsComplete, koComplete])

  const resetBracket = useCallback(async () => {
    setResetting(true)
    const res = await fetch('/api/brackets', { method: 'DELETE' })
    if (res.ok) {
      const defaultRankings: Record<string, string[]> = {}
      for (const group of GROUP_CODES) {
        defaultRankings[group] = GROUPS[group] ?? []
      }
      setGroupRankings(defaultRankings)
      setAdvancingThirds(new Set())
      setWinners({})
      setHasBracket(false)
      setSubmitted(false)
      setShowValidation(false)
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
            <div className="mt-3 rounded-xl border border-pitch-700 bg-pitch-900/60 p-5 space-y-5 text-sm text-pitch-200">

              {/* Step 1 */}
              <div className="flex gap-3">
                <span className="section-label mt-0.5 shrink-0">①</span>
                <div>
                  <p className="text-[#EBF0FF] font-semibold mb-1">Rank each group</p>
                  <p className="leading-relaxed">Drag teams 1st–4th in each group. The top 2 advance automatically.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <span className="section-label mt-0.5 shrink-0">②</span>
                <div>
                  <p className="text-[#EBF0FF] font-semibold mb-1">Pick 8 wildcard 3rd-place teams</p>
                  <p className="leading-relaxed">All 12 groups produce a 3rd-place team, but only <span className="text-[#EBF0FF] font-medium">8 advance to the Round of 32</span>. FIFA ranks the 12 third-place teams using official tiebreakers — points, goal difference, goals scored, and so on — and the best 8 qualify. Under each group card you&apos;ll see a <span className="text-[#CD7F32] font-medium">3rd Place Wildcard</span> checkbox. Check exactly 8 groups whose 3rd-place team you think will make the cut. FIFA&apos;s official table then assigns each to the correct R32 match automatically.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <span className="section-label mt-0.5 shrink-0">③</span>
                <div>
                  <p className="text-[#EBF0FF] font-semibold mb-1">Pick knockout winners</p>
                  <p className="leading-relaxed">Switch to the <span className="text-[#EBF0FF] font-medium">Knockouts</span> tab and pick the winner of every match through to the Final and 3rd-place play-off.</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <div className="anim-fade-up anim-delay-1 px-5">
        <BracketEditor
          groupRankings={groupRankings}
          advancingThirds={advancingThirds}
          winners={winners}
          onGroupChange={(code, order) => {
            setGroupRankings(prev => {
              if (prev[code]?.[2] !== order[2] && advancingThirds.has(code)) {
                setAdvancingThirds(s => { const n = new Set(s); n.delete(code); return n })
              }
              return { ...prev, [code]: order }
            })
          }}
          onAdvancingThirdsChange={handleAdvancingThirdsChange}
          onPick={handlePick}
          disabled={isDisabled}
          showValidation={showValidation}
          submitAttempt={submitAttempt}
          tab={bracketTab}
          onTabChange={setBracketTab}
        />
      </div>

      {!isDisabled && (
        <div className="flex items-start sm:items-center justify-between mt-1 pt-5 border-t border-pitch-700 px-5">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={saveDraft}
              disabled={savingAction !== null}
              className="btn-ghost px-5 py-2.5 text-xs uppercase tracking-widest"
            >
              {savingAction === 'save' ? 'Saving…' : 'Save Draft'}
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
