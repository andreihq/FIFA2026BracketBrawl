'use client'
import { useRef, useEffect } from 'react'
import { KNOCKOUT_MATCHES, KnockoutMatch, MatchPick } from '@/data/bracket'
import { TEAMS } from '@/data/teams'

interface Props {
  groupRankings: Record<string, string[]>
  picks: Record<string, MatchPick>
  onPick: (matchId: string, field: 'teamB' | 'winner', teamCode: string) => void
  disabled?: boolean
  showValidation?: boolean
  correctPicks?: Record<string, MatchPick>
}

const COLUMNS = ['R32', 'R16', 'QF', 'SF', 'FINAL', 'CHAMPIONS'] as const
const COLUMN_LABELS: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarterfinals',
  SF: 'Semifinals', FINAL: 'Finals', CHAMPIONS: 'Champions',
}

function teamLabel(code: string | null, fallback: string): string {
  if (!code) return fallback
  const t = TEAMS[code]
  return t ? `${t.flag} ${t.name}` : code
}

function TeamRow({ teamCode, label, correct }: { teamCode: string | null; label: string; correct?: boolean }) {
  const team = teamCode ? TEAMS[teamCode] : null
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
      correct && team
        ? 'bg-[#34D399]/10 border border-[#34D399]/40 text-[#34D399]'
        : 'bg-pitch-800 border border-pitch-600 text-[#EBF0FF]'
    }`}>
      {team
        ? <><span className="flex-shrink-0">{team.flag}</span><span className="truncate font-medium">{team.name}</span></>
        : <span className="text-pitch-300 truncate italic">{label}</span>}
    </div>
  )
}

const selectBase = `w-full text-xs rounded-lg px-2.5 py-1.5 border cursor-pointer transition-all outline-none appearance-none`

// Dropdown to pick the winner of a source match. Shown in the next stage's match card.
function WinnerDropdown({ srcMatchId, picks, onPick, showValidation }: {
  srcMatchId: string
  picks: Record<string, MatchPick>
  onPick: (matchId: string, field: 'teamB' | 'winner', teamCode: string) => void
  showValidation: boolean
}) {
  const src = picks[srcMatchId]
  const teamA = src?.teamA ?? null
  const teamB = src?.teamB ?? null
  const picked = src?.winner ?? null
  const isError = showValidation && !picked && !!teamA && !!teamB
  return (
    <select
      value={picked ?? ''}
      onChange={e => e.target.value && onPick(srcMatchId, 'winner', e.target.value)}
      disabled={!teamA || !teamB}
      className={`${selectBase} ${
        picked
          ? 'bg-pitch-800 border-pitch-500 text-[#EBF0FF]'
          : isError
            ? 'bg-red-950/30 border-red-700 text-pitch-400'
            : 'bg-pitch-700 border-pitch-500 text-pitch-200'
      } hover:border-pitch-400 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <option value="" disabled hidden>Pick {srcMatchId} winner…</option>
      <option value={teamA ?? ''}>{teamLabel(teamA, '')}</option>
      <option value={teamB ?? ''}>{teamLabel(teamB, '')}</option>
    </select>
  )
}

// Dropdown to pick the Best 3rd qualifier. Shown directly in the R32 match card.
function QualifierDropdown({ match, groupRankings, picks, onPick, showValidation }: {
  match: KnockoutMatch
  groupRankings: Record<string, string[]>
  picks: Record<string, MatchPick>
  onPick: (matchId: string, field: 'teamB' | 'winner', teamCode: string) => void
  showValidation: boolean
}) {
  const groups = match.slotB.replace('Best 3rd ', '').split('')
  const pickedElsewhere = new Set(
    KNOCKOUT_MATCHES
      .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd') && m.id !== match.id)
      .map(m => picks[m.id]?.teamB)
      .filter(Boolean) as string[]
  )
  const eligible = groups
    .map(g => groupRankings[g]?.[2])
    .filter((c): c is string => !!c && !pickedElsewhere.has(c))

  const picked = picks[match.id]?.teamB ?? ''
  const isError = showValidation && !picked
  return (
    <select
      value={picked}
      onChange={e => e.target.value && onPick(match.id, 'teamB', e.target.value)}
      disabled={eligible.length === 0}
      className={`${selectBase} ${
        picked
          ? 'bg-pitch-800 border-pitch-500 text-[#EBF0FF]'
          : isError
            ? 'bg-red-950/30 border-red-700 text-pitch-400'
            : 'bg-pitch-700 border-pitch-500 text-pitch-200'
      } hover:border-pitch-400 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <option value="" disabled hidden>Pick 3rd {groups.join('/')}…</option>
      {eligible.map(code => (
        <option key={code} value={code}>{teamLabel(code, '')}</option>
      ))}
    </select>
  )
}

function MatchCard({ match, groupRankings, picks, onPick, disabled, label, showValidation, correctPicks }: {
  match: KnockoutMatch
  groupRankings: Record<string, string[]>
  picks: Record<string, MatchPick>
  onPick: (matchId: string, field: 'teamB' | 'winner', teamCode: string) => void
  disabled: boolean
  label?: string
  showValidation: boolean
  correctPicks?: Record<string, MatchPick>
}) {
  const isR32 = match.round === 'R32'
  const isBest3rdB = match.slotB.startsWith('Best 3rd')
  const mp = picks[match.id] ?? { teamA: null, teamB: null, winner: null }
  const cp = correctPicks?.[match.id]

  const srcA = match.slotA.match(/^Winner (M\d+)$/)?.[1] ?? null
  const srcB = match.slotB.match(/^Winner (M\d+)$/)?.[1] ?? null

  const slotBLabel = isBest3rdB
    ? `3rd: ${match.slotB.replace('Best 3rd ', '').split('').join('/')}`
    : match.slotB

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
          correct={disabled && !!mp.teamA && mp.teamA === cp?.teamA}
        />
      ) : (
        <WinnerDropdown srcMatchId={srcA} picks={picks} onPick={onPick} showValidation={showValidation} />
      )}

      <div className="h-px bg-pitch-700 mx-1.5 my-0.5" />

      {disabled ? (
        <TeamRow
          teamCode={mp.teamB}
          label={slotBLabel}
          correct={!!mp.teamB && mp.teamB === cp?.teamB}
        />
      ) : isR32 && isBest3rdB ? (
        <QualifierDropdown match={match} groupRankings={groupRankings} picks={picks} onPick={onPick} showValidation={showValidation} />
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
  onPick: (matchId: string, field: 'teamB' | 'winner', teamCode: string) => void
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

  return (
    <div className="flex flex-col flex-1 justify-center gap-5 px-3 pb-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-gold uppercase tracking-widest">🥇 Champion</div>
        {disabled ? (
          <TeamRow teamCode={champion} label="TBD" correct={!!(champion && correctPicks?.['M104']?.winner === champion)} />
        ) : (
          <select
            value={champion ?? ''}
            onChange={e => e.target.value && onPick('M104', 'winner', e.target.value)}
            disabled={!finalistA || !finalistB}
            className={`${selectBase} font-semibold ${
              champion
                ? 'bg-gold/10 border-gold/40 text-gold'
                : showValidation && !champion && finalistA && finalistB
                  ? 'bg-red-950/30 border-red-700 text-pitch-400'
                  : 'bg-pitch-700 border-pitch-500 text-pitch-200'
            } hover:border-gold/30 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="" disabled hidden>Pick Champion…</option>
            <option value={finalistA ?? ''}>{teamLabel(finalistA, '')}</option>
            <option value={finalistB ?? ''}>{teamLabel(finalistB, '')}</option>
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-[#C0C8D8] uppercase tracking-widest">🥈 Runner-up</div>
        <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
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
          <TeamRow teamCode={thirdPlace} label="TBD" correct={!!(thirdPlace && correctPicks?.['M103']?.winner === thirdPlace)} />
        ) : (
          <select
            value={thirdPlace ?? ''}
            onChange={e => e.target.value && onPick('M103', 'winner', e.target.value)}
            disabled={!loserA || !loserB}
            className={`${selectBase} ${
              thirdPlace
                ? 'bg-[#3d2810]/40 border-[#C4834A]/40 text-[#C4834A] font-medium'
                : showValidation && !thirdPlace && loserA && loserB
                  ? 'bg-red-950/30 border-red-700 text-pitch-400'
                  : 'bg-pitch-700 border-pitch-500 text-pitch-200'
            } hover:border-[#C4834A]/30 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="" disabled hidden>Pick 3rd Place…</option>
            <option value={loserA ?? ''}>{teamLabel(loserA, '')}</option>
            <option value={loserB ?? ''}>{teamLabel(loserB, '')}</option>
          </select>
        )}
      </div>
    </div>
  )
}

export function KnockoutBracket({ groupRankings, picks, onPick, disabled = false, showValidation = false, correctPicks }: Props) {
  const finalMatches = KNOCKOUT_MATCHES.filter(m => m.round === 'FINAL' || m.round === '3RD')
  const allPicksMade = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
    && KNOCKOUT_MATCHES
      .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd'))
      .every(m => !!picks[m.id]?.teamB)

  const errorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (showValidation && !allPicksMade) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showValidation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overflow-x-auto pb-2">
      {showValidation && !allPicksMade && (
        <div ref={errorRef} className="scroll-mt-20 mb-4 rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm font-medium text-[#F87171]">
          Complete all picks before submitting — missing selections are highlighted.
        </div>
      )}
      <div className="flex min-w-max items-stretch">
        {COLUMNS.map(col => (
          <div key={col} className="flex flex-col" style={{ minWidth: 180 }}>
            <div className="section-label text-center py-3 font-display text-[11px] tracking-widest">
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
                  <MatchCard
                    key={match.id}
                    match={match}
                    label={match.round === 'FINAL' ? `Finals · ${match.id}` : `3rd Place · ${match.id}`}
                    groupRankings={groupRankings}
                    picks={picks}
                    onPick={onPick}
                    disabled={disabled}
                    showValidation={showValidation}
                    correctPicks={correctPicks}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col flex-1 justify-around gap-3 px-2 pb-4">
                {KNOCKOUT_MATCHES.filter(m => m.round === col).map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    groupRankings={groupRankings}
                    picks={picks}
                    onPick={onPick}
                    disabled={disabled}
                    showValidation={showValidation}
                    correctPicks={correctPicks}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
