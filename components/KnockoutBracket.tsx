'use client'
import { useRef, useEffect, useState } from 'react'
import { KNOCKOUT_MATCHES, KnockoutMatch, MatchPick, isKnockoutWinnerCorrect } from '@/data/bracket'
import { TEAMS } from '@/data/teams'
import { MatchDropdown, DropdownOption } from './MatchDropdown'

// Precompute bracket connector pairs: [topSrcId, botSrcId, destId]
const CONNECTOR_PAIRS: [string, string, string][] = (() => {
  const groups: Record<string, { id: string; feedsSlot: 'A' | 'B' }[]> = {}
  for (const m of KNOCKOUT_MATCHES) {
    if (m.feedsInto && m.feedsSlot) {
      if (!groups[m.feedsInto]) groups[m.feedsInto] = []
      groups[m.feedsInto].push({ id: m.id, feedsSlot: m.feedsSlot })
    }
  }
  return Object.entries(groups)
    .filter(([, srcs]) => srcs.length === 2)
    .map(([dest, srcs]) => {
      const [a, b] = srcs[0].feedsSlot === 'A' ? [srcs[0], srcs[1]] : [srcs[1], srcs[0]]
      return [a.id, b.id, dest] as [string, string, string]
    })
})()

interface Seg { x1: number; y1: number; x2: number; y2: number }

interface Props {
  picks: Record<string, MatchPick>
  onPick: (matchId: string, winner: string) => void
  disabled?: boolean
  showValidation?: boolean
  submitAttempt?: number
  correctPicks?: Record<string, MatchPick>
}

const COLUMNS = ['R32', 'R16', 'QF', 'SF', 'FINAL', 'CHAMPIONS'] as const
const COLUMN_LABELS: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarterfinals',
  SF: 'Semifinals', FINAL: 'Finals', CHAMPIONS: 'Champions',
}

function teamOpt(code: string | null): DropdownOption | null {
  if (!code) return null
  const t = TEAMS[code]
  return { value: code, flag: t?.flag, teamName: t?.name ?? code }
}

function TeamRow({ teamCode, label, correct, variant }: {
  teamCode: string | null
  label: string
  correct?: boolean
  variant?: 'gold' | 'bronze'
}) {
  const team = teamCode ? TEAMS[teamCode] : null
  const colorClass = correct && team
    ? 'bg-[#34D399]/10 border border-[#34D399]/40 text-[#34D399]'
    : variant === 'gold' && team
      ? 'bg-[#F5A623]/10 border border-[#F5A623]/40 text-[#F5A623]'
      : variant === 'bronze' && team
        ? 'bg-[#3d2810]/40 border border-[#C4834A]/40 text-[#C4834A]'
        : 'bg-pitch-800 border border-pitch-600 text-[#EBF0FF]'
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${colorClass}`}>
      {team
        ? <><span className="flex-shrink-0">{team.flag}</span><span className="truncate font-medium">{team.name}</span></>
        : <span className="text-pitch-300 truncate italic">{label}</span>}
    </div>
  )
}

function WinnerDropdown({ srcMatchId, picks, onPick, showValidation }: {
  srcMatchId: string
  picks: Record<string, MatchPick>
  onPick: (matchId: string, winner: string) => void
  showValidation: boolean
}) {
  const src = picks[srcMatchId]
  const teamA = src?.teamA ?? null
  const teamB = src?.teamB ?? null
  const picked = src?.winner ?? null
  const isError = showValidation && !picked && !!teamA && !!teamB

  const options = [teamOpt(teamA), teamOpt(teamB)].filter((o): o is DropdownOption => !!o)

  return (
    <MatchDropdown
      value={picked ?? ''}
      options={options}
      placeholder={`Pick ${srcMatchId} Winner`}
      onChange={code => onPick(srcMatchId, code)}
      disabled={!teamA || !teamB}
      isError={isError}
    />
  )
}

function MatchCard({ match, picks, onPick, disabled, label, showValidation, correctPicks, dividerRef }: {
  match: KnockoutMatch
  picks: Record<string, MatchPick>
  onPick: (matchId: string, winner: string) => void
  disabled: boolean
  label?: string
  showValidation: boolean
  correctPicks?: Record<string, MatchPick>
  dividerRef?: React.RefCallback<HTMLDivElement>
}) {
  const isR32 = match.round === 'R32'
  const isBest3rdB = match.slotB === 'W'
  const mp = picks[match.id] ?? { teamA: null, teamB: null, winner: null }
  const cp = correctPicks?.[match.id]

  // Highlight the winner of THIS match (green) when the player's predicted winner
  // matches the actual winner — so the green lands in the match's own column.
  const winnerCorrect = isKnockoutWinnerCorrect(mp.winner, cp?.winner)
  const teamAWon = winnerCorrect && !!mp.teamA && mp.teamA === mp.winner
  const teamBWon = winnerCorrect && !!mp.teamB && mp.teamB === mp.winner

  const srcA = match.slotA.match(/^Winner (M\d+)$/)?.[1] ?? null
  const srcB = match.slotB.match(/^Winner (M\d+)$/)?.[1] ?? null

  const slotBLabel = isBest3rdB ? '3rd Place Wildcard' : match.slotB

  return (
    <div className="flex flex-col gap-0.5">
      {label
        ? <div className="text-[10px] font-semibold text-pitch-300 px-0.5 mb-1 uppercase tracking-wide">{label}</div>
        : <div className="text-[9px] text-pitch-600 px-0.5 mb-1 font-mono">{match.id}</div>
      }

      {disabled || isR32 || !srcA ? (
        <TeamRow
          teamCode={mp.teamA}
          label={match.slotA}
          correct={disabled && teamAWon}
        />
      ) : (
        <WinnerDropdown srcMatchId={srcA} picks={picks} onPick={onPick} showValidation={showValidation} />
      )}

      <div ref={dividerRef} className="h-px bg-pitch-700 mx-1.5 my-0.5" />

      {disabled ? (
        <TeamRow
          teamCode={mp.teamB}
          label={slotBLabel}
          correct={teamBWon}
        />
      ) : isR32 || !srcB ? (
        <TeamRow teamCode={mp.teamB} label={slotBLabel} />
      ) : (
        <WinnerDropdown srcMatchId={srcB} picks={picks} onPick={onPick} showValidation={showValidation} />
      )}
    </div>
  )
}

function ChampionsPodium({ picks, onPick, disabled, showValidation, correctPicks }: {
  picks: Record<string, MatchPick>
  onPick: (matchId: string, winner: string) => void
  disabled: boolean
  showValidation: boolean
  correctPicks?: Record<string, MatchPick>
}) {
  const finalistA = picks['M104']?.teamA ?? null
  const finalistB = picks['M104']?.teamB ?? null
  const champion = picks['M104']?.winner ?? null
  const runnerUp = champion ? (champion === finalistA ? finalistB : finalistA) : null

  const loserA = picks['M103']?.teamA ?? null
  const loserB = picks['M103']?.teamB ?? null
  const thirdPlace = picks['M103']?.winner ?? null

  const championOptions = [teamOpt(finalistA), teamOpt(finalistB)].filter((o): o is DropdownOption => !!o)
  const thirdOptions = [teamOpt(loserA), teamOpt(loserB)].filter((o): o is DropdownOption => !!o)

  return (
    <div className="flex flex-col flex-1 justify-center gap-5 px-3 pb-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-gold uppercase tracking-widest">🥇 Champion</div>
        {disabled ? (
          <TeamRow teamCode={champion} label="TBD" variant="gold" correct={!!(champion && correctPicks?.['M104']?.winner === champion)} />
        ) : (
          <MatchDropdown
            value={champion ?? ''}
            options={championOptions}
            placeholder="Pick Champion…"
            onChange={code => onPick('M104', code)}
            disabled={!finalistA || !finalistB}
            isError={showValidation && !champion && !!finalistA && !!finalistB}
            variant="gold"
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-[#C0C8D8] uppercase tracking-widest">🥈 Runner-up</div>
        <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
          runnerUp
            ? 'bg-[#C0C8D8]/10 border border-[#C0C8D8]/40 text-[#C0C8D8]'
            : 'bg-pitch-800 border border-pitch-600 text-[#EBF0FF]'
        }`}>
          {runnerUp && TEAMS[runnerUp]
            ? <><span className="flex-shrink-0">{TEAMS[runnerUp].flag}</span><span className="truncate font-medium">{TEAMS[runnerUp].name}</span></>
            : <span className="text-pitch-300 truncate italic">Loser of Finals</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-[#C4834A] uppercase tracking-widest">🥉 3rd Place</div>
        {disabled ? (
          <TeamRow teamCode={thirdPlace} label="TBD" variant="bronze" correct={!!(thirdPlace && correctPicks?.['M103']?.winner === thirdPlace)} />
        ) : (
          <MatchDropdown
            value={thirdPlace ?? ''}
            options={thirdOptions}
            placeholder="Pick 3rd Place…"
            onChange={code => onPick('M103', code)}
            disabled={!loserA || !loserB}
            isError={showValidation && !thirdPlace && !!loserA && !!loserB}
            variant="bronze"
          />
        )}
      </div>
    </div>
  )
}

export function KnockoutBracket({ picks, onPick, disabled = false, showValidation = false, submitAttempt = 0, correctPicks }: Props) {
  const finalMatches = KNOCKOUT_MATCHES.filter(m => m.round === 'FINAL' || m.round === '3RD')
  const allPicksMade = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)

  const errorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dividerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [segs, setSegs] = useState<Seg[]>([])

  useEffect(() => {
    if (showValidation && !allPicksMade) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [submitAttempt]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      if (!container) return
      const base = container.getBoundingClientRect()
      const next: Seg[] = []
      for (const [topId, botId, destId] of CONNECTOR_PAIRS) {
        const topEl = cardRefs.current[topId]
        const botEl = cardRefs.current[botId]
        const destEl = cardRefs.current[destId]
        if (!topEl || !botEl || !destEl) continue
        const tr = topEl.getBoundingClientRect()
        const br = botEl.getBoundingClientRect()
        const dr = destEl.getBoundingClientRect()
        const divY = (el: HTMLDivElement | null) => {
          if (!el) return 0
          const r = el.getBoundingClientRect()
          return r.top + r.height / 2 - base.top
        }
        const y1 = divY(dividerRefs.current[topId])   || (tr.top + tr.height / 2 - base.top)
        const y2 = divY(dividerRefs.current[botId])   || (br.top + br.height / 2 - base.top)
        const yd = divY(dividerRefs.current[destId])  || (y1 + y2) / 2
        const xSrc = tr.right - base.left
        const xDest = dr.left - base.left
        const xMid = (xSrc + xDest) / 2
        next.push(
          { x1: xSrc, y1, x2: xMid, y2: y1 },
          { x1: xMid, y1, x2: xMid, y2: y2 },
          { x1: xSrc, y1: y2, x2: xMid, y2: y2 },
          { x1: xMid, y1: yd, x2: xDest, y2: yd },
        )
      }
      setSegs(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overflow-x-auto pb-2">
      {showValidation && !allPicksMade && (
        <div ref={errorRef} className="scroll-mt-20 mb-4 rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm font-medium text-[#F87171]">
          Complete all picks before submitting — missing selections are highlighted.
        </div>
      )}
      <div ref={containerRef} className="relative flex min-w-max items-stretch gap-4">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" overflow="visible">
          {segs.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke="#3D4F6E" strokeWidth={1.5} />
          ))}
        </svg>

        {COLUMNS.map(col => (
          <div key={col} className="flex flex-col" style={{ minWidth: 180 }}>
            <div className="section-label text-center py-3 font-display text-[14px] tracking-widest">
              {COLUMN_LABELS[col]}
            </div>

            {col === 'CHAMPIONS' ? (
              <ChampionsPodium
                picks={picks}
                onPick={onPick}
                disabled={disabled}
                showValidation={showValidation}
                correctPicks={correctPicks}
              />
            ) : col === 'FINAL' ? (
              <div className="flex flex-col flex-1 justify-center gap-6 px-2 pb-4">
                {finalMatches.map(match => (
                  <div key={match.id} ref={el => { cardRefs.current[match.id] = el }}>
                    <MatchCard
                      match={match}
                      label={match.round === 'FINAL' ? `Finals · ${match.id}` : `3rd Place · ${match.id}`}
                      picks={picks}
                      onPick={onPick}
                      disabled={disabled}
                      showValidation={showValidation}
                      correctPicks={correctPicks}
                      dividerRef={el => { dividerRefs.current[match.id] = el }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col flex-1 justify-around gap-3 px-2 pb-4">
                {KNOCKOUT_MATCHES.filter(m => m.round === col).map(match => (
                  <div key={match.id} ref={el => { cardRefs.current[match.id] = el }}>
                    <MatchCard
                      match={match}
                      picks={picks}
                      onPick={onPick}
                      disabled={disabled}
                      showValidation={showValidation}
                      correctPicks={correctPicks}
                      dividerRef={el => { dividerRefs.current[match.id] = el }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
