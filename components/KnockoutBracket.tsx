'use client'
import { useRef, useEffect } from 'react'
import { KNOCKOUT_MATCHES, KnockoutMatch, resolveTeam } from '@/data/bracket'
import { TEAMS } from '@/data/teams'

interface Props {
  groupRankings: Record<string, string[]>
  picks: Record<string, string>
  onPick: (matchId: string, teamCode: string) => void
  thirdPicks: Record<string, string>
  onThirdPick: (matchId: string, teamCode: string | null) => void
  disabled?: boolean
  showValidation?: boolean
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

function TeamRow({ teamCode, label }: { teamCode: string | null; label: string }) {
  const team = teamCode ? TEAMS[teamCode] : null
  return (
    <div className="flex items-center gap-2 rounded-lg bg-pitch-800 border border-pitch-600 px-2.5 py-1.5 text-xs text-[#EBF0FF]">
      {team
        ? <><span className="flex-shrink-0">{team.flag}</span><span className="truncate font-medium">{team.name}</span></>
        : <span className="text-pitch-300 truncate italic">{label}</span>}
    </div>
  )
}

const selectBase = `w-full text-xs rounded-lg px-2.5 py-1.5 border cursor-pointer transition-all outline-none appearance-none`

function SlotDropdown({ slotLabel, matchId, groupRankings, picks, thirdPicks, onPick, disabled, showValidation }: {
  slotLabel: string
  matchId: string
  groupRankings: Record<string, string[]>
  picks: Record<string, string>
  thirdPicks: Record<string, string>
  onPick: (matchId: string, code: string) => void
  disabled: boolean
  showValidation: boolean
}) {
  const sourceMatch = slotLabel.match(/^Winner (M\d+)$/)
  if (!sourceMatch) {
    const team = resolveTeam(slotLabel, matchId, groupRankings, picks, thirdPicks)
    return <TeamRow teamCode={team} label={slotLabel} />
  }

  const srcId = sourceMatch[1]
  const src = KNOCKOUT_MATCHES.find(m => m.id === srcId)!
  const teamA = resolveTeam(src.slotA, srcId, groupRankings, picks, thirdPicks)
  const teamB = resolveTeam(src.slotB, srcId, groupRankings, picks, thirdPicks)
  const picked = picks[srcId]

  if (disabled) {
    const team = picked ? TEAMS[picked] : null
    return (
      <div className="flex items-center gap-2 rounded-lg bg-pitch-800 border border-pitch-600 px-2.5 py-1.5 text-xs text-[#EBF0FF]">
        {team
          ? <><span>{team.flag}</span><span className="truncate font-medium">{team.name}</span></>
          : <span className="text-pitch-300 italic truncate">{slotLabel}</span>}
      </div>
    )
  }

  const isError = showValidation && !picked
  return (
    <select
      value={picked ?? ''}
      onChange={e => e.target.value && onPick(srcId, e.target.value)}
      disabled={!teamA || !teamB}
      className={`${selectBase} ${
        picked
          ? 'bg-pitch-800 border-pitch-500 text-[#EBF0FF]'
          : isError
            ? 'bg-red-950/30 border-red-700 text-pitch-400'
            : 'bg-pitch-700 border-pitch-500 text-pitch-200'
      } hover:border-pitch-400 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <option value="" disabled hidden>Pick winner…</option>
      <option value={teamA ?? ''}>{teamLabel(teamA, '')}</option>
      <option value={teamB ?? ''}>{teamLabel(teamB, '')}</option>
    </select>
  )
}

function ThirdPlaceTeamPicker({ matchId, slotLabel, groupRankings, thirdPicks, onThirdPick, disabled, showValidation }: {
  matchId: string
  slotLabel: string
  groupRankings: Record<string, string[]>
  thirdPicks: Record<string, string>
  onThirdPick: (matchId: string, teamCode: string | null) => void
  disabled: boolean
  showValidation: boolean
}) {
  const groups = slotLabel.replace('Best 3rd ', '').split('')
  const eligible = groups.map(g => groupRankings[g]?.[2]).filter(Boolean) as string[]
  const selected = thirdPicks[matchId] ?? null
  const team = selected ? TEAMS[selected] : null

  if (disabled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-pitch-800 border border-pitch-600 px-2.5 py-1.5 text-xs text-pitch-300">
        {team
          ? <><span>{team.flag}</span><span className="truncate font-medium">{team.name}</span></>
          : <span className="italic">3rd: {groups.join('/')}</span>}
      </div>
    )
  }

  const isError = showValidation && !selected
  return (
    <select
      value={selected ?? ''}
      onChange={e => e.target.value && onThirdPick(matchId, e.target.value)}
      className={`${selectBase} ${
        selected
          ? 'bg-pitch-800 border-pitch-500 text-[#EBF0FF]'
          : isError
            ? 'bg-red-950/30 border-red-700 text-pitch-400'
            : 'bg-pitch-700 border-pitch-500 text-pitch-200'
      } hover:border-pitch-400`}
    >
      <option value="" disabled hidden>Best 3rd {groups.join('/')}…</option>
      {eligible.map(code => (
        <option key={code} value={code}>{teamLabel(code, code)}</option>
      ))}
    </select>
  )
}

function MatchCard({ match, groupRankings, picks, thirdPicks, onPick, onThirdPick, disabled, label, showValidation }: {
  match: KnockoutMatch
  groupRankings: Record<string, string[]>
  picks: Record<string, string>
  thirdPicks: Record<string, string>
  onPick: (matchId: string, code: string) => void
  onThirdPick: (matchId: string, teamCode: string | null) => void
  disabled: boolean
  label?: string
  showValidation: boolean
}) {
  const isR32 = match.round === 'R32'
  const isBest3rdB = match.slotB.startsWith('Best 3rd')

  return (
    <div className="flex flex-col gap-0.5">
      {label
        ? <div className="text-[10px] font-semibold text-pitch-300 px-0.5 mb-1 uppercase tracking-wide">{label}</div>
        : <div className="text-[9px] text-pitch-600 px-0.5 mb-1 font-mono">{match.id}</div>
      }

      {isR32 ? (
        <TeamRow
          teamCode={resolveTeam(match.slotA, match.id, groupRankings, picks, thirdPicks)}
          label={match.slotA}
        />
      ) : (
        <SlotDropdown
          slotLabel={match.slotA}
          matchId={match.id}
          groupRankings={groupRankings}
          picks={picks}
          thirdPicks={thirdPicks}
          onPick={onPick}
          disabled={disabled}
          showValidation={showValidation}
        />
      )}

      <div className="h-px bg-pitch-700 mx-1.5 my-0.5" />

      {isR32 && isBest3rdB ? (
        <ThirdPlaceTeamPicker
          matchId={match.id}
          slotLabel={match.slotB}
          groupRankings={groupRankings}
          thirdPicks={thirdPicks}
          onThirdPick={onThirdPick}
          disabled={disabled}
          showValidation={showValidation}
        />
      ) : isR32 ? (
        <TeamRow
          teamCode={resolveTeam(match.slotB, match.id, groupRankings, picks, thirdPicks)}
          label={match.slotB}
        />
      ) : (
        <SlotDropdown
          slotLabel={match.slotB}
          matchId={match.id}
          groupRankings={groupRankings}
          picks={picks}
          thirdPicks={thirdPicks}
          onPick={onPick}
          disabled={disabled}
          showValidation={showValidation}
        />
      )}
    </div>
  )
}

function ChampionsPodium({ groupRankings, picks, thirdPicks, onPick, disabled, showValidation }: {
  groupRankings: Record<string, string[]>
  picks: Record<string, string>
  thirdPicks: Record<string, string>
  onPick: (matchId: string, code: string) => void
  disabled: boolean
  showValidation: boolean
}) {
  const finalistA = resolveTeam('Winner M101', 'M104', groupRankings, picks, thirdPicks)
  const finalistB = resolveTeam('Winner M102', 'M104', groupRankings, picks, thirdPicks)
  const champion = picks['M104'] ?? null
  const runnerUp = champion ? (champion === finalistA ? finalistB : finalistA) : null

  const loserA = resolveTeam('Loser M101', 'M103', groupRankings, picks, thirdPicks)
  const loserB = resolveTeam('Loser M102', 'M103', groupRankings, picks, thirdPicks)
  const thirdPlace = picks['M103'] ?? null

  return (
    <div className="flex flex-col flex-1 justify-center gap-5 px-3 pb-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-gold uppercase tracking-widest">🥇 Champion</div>
        {disabled ? (
          <TeamRow teamCode={champion} label="TBD" />
        ) : (
          <select
            value={champion ?? ''}
            onChange={e => e.target.value && onPick('M104', e.target.value)}
            disabled={!finalistA || !finalistB}
            className={`${selectBase} font-semibold ${
              champion
                ? 'bg-gold/10 border-gold/40 text-gold'
                : showValidation && !champion
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
        <div className="text-[10px] font-bold text-pitch-200 uppercase tracking-widest">🥈 Runner-up</div>
        <TeamRow teamCode={runnerUp} label="Loser of Finals" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-[#C4834A] uppercase tracking-widest">🥉 3rd Place</div>
        {disabled ? (
          <TeamRow teamCode={thirdPlace} label="TBD" />
        ) : (
          <select
            value={thirdPlace ?? ''}
            onChange={e => e.target.value && onPick('M103', e.target.value)}
            disabled={!loserA || !loserB}
            className={`${selectBase} ${
              thirdPlace
                ? 'bg-[#3d2810]/40 border-[#C4834A]/40 text-[#C4834A] font-medium'
                : showValidation && !thirdPlace
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

export function KnockoutBracket({ groupRankings, picks, onPick, thirdPicks, onThirdPick, disabled = false, showValidation = false }: Props) {
  const finalMatches = KNOCKOUT_MATCHES.filter(m => m.round === 'FINAL' || m.round === '3RD')

  const allPicksMade =
    KNOCKOUT_MATCHES.every(m => !!picks[m.id]) &&
    KNOCKOUT_MATCHES.filter(m => m.slotB.startsWith('Best 3rd')).every(m => !!thirdPicks[m.id])

  const errorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (showValidation && !allPicksMade) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showValidation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overflow-x-auto pb-2">
      {showValidation && !allPicksMade && (
        <div ref={errorRef} className="mb-4 rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm font-medium text-[#F87171]">
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
                groupRankings={groupRankings}
                picks={picks}
                thirdPicks={thirdPicks}
                onPick={onPick}
                disabled={disabled}
                showValidation={showValidation}
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
                    thirdPicks={thirdPicks}
                    onPick={onPick}
                    onThirdPick={onThirdPick}
                    disabled={disabled}
                    showValidation={showValidation}
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
                    thirdPicks={thirdPicks}
                    onPick={onPick}
                    onThirdPick={onThirdPick}
                    disabled={disabled}
                    showValidation={showValidation}
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
