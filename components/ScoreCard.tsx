'use client'
import { useState } from 'react'
import { GROUP_STAGE_POINTS, WILDCARD_POINTS, KNOCKOUT_ROUND_POINTS } from '@/lib/scoring'

type Score = { groupPoints: number; knockoutPoints: number; total: number }

// Rendered straight from the scoring constants so the guide can never drift from
// how points are actually awarded. Final & 3rd-place share the top weight.
const KNOCKOUT_GUIDE: { label: string; round: keyof typeof KNOCKOUT_ROUND_POINTS }[] = [
  { label: 'Round of 32', round: 'R32' },
  { label: 'Round of 16', round: 'R16' },
  { label: 'Quarter-finals', round: 'QF' },
  { label: 'Semi-finals', round: 'SF' },
  { label: 'Final', round: 'FINAL' },
  { label: '3rd-place play-off', round: '3RD' },
]

function Pts({ value }: { value: number }) {
  return (
    <span className="shrink-0 rounded-md bg-gold/10 px-2 py-0.5 font-display text-base leading-none tracking-wider text-gold tabular-nums">
      +{value}
    </span>
  )
}

export function ScoreCard({ score }: { score: Score }) {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="section-label">Points Scored</p>
        <button
          onClick={() => setShowGuide(s => !s)}
          aria-expanded={showGuide}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-pitch-200 hover:text-[#EBF0FF] transition-colors whitespace-nowrap"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 7.5v4M8 5.5h.01" />
          </svg>
          How Points are Calculated
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ transform: showGuide ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M2 3.5l3 3 3-3" />
          </svg>
        </button>
      </div>

      {showGuide && (
        <div className="anim-fade-in mb-3 rounded-xl border border-pitch-700 bg-pitch-900/60 p-5 space-y-5 text-sm text-pitch-200">
          <div>
            <p className="section-label mb-2.5">Group Stage</p>
            <ul className="space-y-2">
              <li className="flex items-center justify-between gap-3">
                <span>Each correct group finish (1st–4th)</span>
                <Pts value={GROUP_STAGE_POINTS} />
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Each correct 3rd-place wildcard</span>
                <Pts value={WILDCARD_POINTS} />
              </li>
            </ul>
          </div>

          <div>
            <p className="section-label mb-2.5">Knockout — each correct winner</p>
            <ul className="space-y-2">
              {KNOCKOUT_GUIDE.map(({ label, round }) => (
                <li key={round} className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  <Pts value={KNOCKOUT_ROUND_POINTS[round]} />
                </li>
              ))}
            </ul>
          </div>

          <p className="border-t border-pitch-700 pt-3 text-xs leading-relaxed text-pitch-400">
            Knockout points double round by round, so your deep-run picks decide the title. Group &amp; wildcard points add to the <span className="text-pitch-200">Group Stage</span> total; everything from the Round of 32 onward adds to the <span className="text-pitch-200">Knockout</span> total.
          </p>
        </div>
      )}

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
  )
}
