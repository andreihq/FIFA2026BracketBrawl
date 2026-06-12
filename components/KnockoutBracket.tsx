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
    <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs bg-slate-800 border border-slate-700 text-slate-300">
      {team
        ? <><span className="flex-shrink-0">{team.flag}</span><span className="truncate">{team.name}</span></>
        : <span className="text-slate-500 truncate">{label}</span>}
    </div>
  )
}

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
      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs bg-slate-800 border border-slate-700 text-slate-300">
        {team
          ? <><span>{team.flag}</span><span className="truncate">{team.name}</span></>
          : <span className="text-slate-500 truncate">{slotLabel}</span>}
      </div>
    )
  }

  const isError = showValidation && !picked
  return (
    <select
      value={picked ?? ''}
      onChange={e => e.target.value && onPick(srcId, e.target.value)}
      disabled={!teamA || !teamB}
      className={`w-full text-xs rounded px-2 py-1.5 border cursor-pointer transition-colors
        ${picked
          ? 'bg-slate-800 border-slate-600 text-slate-200'
          : isError
            ? 'bg-slate-900 border-red-500 text-slate-400'
            : 'bg-slate-900 border-slate-600 text-slate-400'}
      `}
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
      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs bg-slate-800 border border-slate-700 text-slate-500">
        {team
          ? <><span>{team.flag}</span><span className="truncate">{team.name}</span></>
          : <span>3rd: {groups.join('/')}</span>}
      </div>
    )
  }

  const isError = showValidation && !selected
  return (
    <select
      value={selected ?? ''}
      onChange={e => e.target.value && onThirdPick(matchId, e.target.value)}
      className={`w-full text-xs rounded px-2 py-1.5 border cursor-pointer transition-colors
        ${selected
          ? 'bg-slate-800 border-slate-600 text-slate-200'
          : isError
            ? 'bg-slate-900 border-red-500 text-slate-400'
            : 'bg-slate-900 border-slate-600 text-slate-400'}
      `}
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
        ? <div className="text-xs text-slate-400 px-1 mb-0.5 font-medium">{label}</div>
        : <div className="text-xs text-slate-700 px-1 mb-0.5 font-mono">{match.id}</div>
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

      <div className="h-px bg-slate-700 mx-2" />

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

// Champions column — dropdowns for 1st and 3rd, runner-up auto-populates
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
        <div className="text-xs font-bold text-yellow-400 tracking-wide">🥇 Champion</div>
        {disabled ? (
          <TeamRow teamCode={champion} label="TBD" />
        ) : (
          <select
            value={champion ?? ''}
            onChange={e => e.target.value && onPick('M104', e.target.value)}
            disabled={!finalistA || !finalistB}
            className={`w-full text-xs rounded px-2 py-1.5 border cursor-pointer transition-colors ${
              champion
                ? 'bg-yellow-950 border-yellow-700 text-yellow-300 font-medium'
                : showValidation && !champion
                  ? 'bg-slate-900 border-red-500 text-slate-400'
                  : 'bg-slate-900 border-slate-600 text-slate-400'
            }`}
          >
            <option value="" disabled hidden>Pick Champion…</option>
            <option value={finalistA ?? ''}>{teamLabel(finalistA, '')}</option>
            <option value={finalistB ?? ''}>{teamLabel(finalistB, '')}</option>
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-bold text-slate-300 tracking-wide">🥈 Runner-up</div>
        <TeamRow teamCode={runnerUp} label="Loser of Finals · M104" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-bold text-amber-600 tracking-wide">🥉 3rd Place</div>
        {disabled ? (
          <TeamRow teamCode={thirdPlace} label="TBD" />
        ) : (
          <select
            value={thirdPlace ?? ''}
            onChange={e => e.target.value && onPick('M103', e.target.value)}
            disabled={!loserA || !loserB}
            className={`w-full text-xs rounded px-2 py-1.5 border cursor-pointer transition-colors ${
              thirdPlace
                ? 'bg-amber-950 border-amber-800 text-amber-300 font-medium'
                : showValidation && !thirdPlace
                  ? 'bg-slate-900 border-red-500 text-slate-400'
                  : 'bg-slate-900 border-slate-600 text-slate-400'
            }`}
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
  }, [showValidation])

  return (
    <div className="overflow-x-auto pb-2">
      {showValidation && !allPicksMade && (
        <div ref={errorRef} className="mb-3 px-3 py-2 rounded bg-red-950 border border-red-700 text-red-300 text-sm font-medium">
          Please pick all winners before submitting — missing picks are highlighted in red.
        </div>
      )}
      <div className="flex min-w-max items-stretch">
        {COLUMNS.map(col => (
          <div key={col} className="flex flex-col" style={{ minWidth: 176 }}>
            <div className="text-xs text-slate-500 text-center py-2 font-medium tracking-wide">
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
