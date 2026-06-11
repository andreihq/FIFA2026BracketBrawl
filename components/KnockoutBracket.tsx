'use client'
import { KNOCKOUT_MATCHES } from '@/data/bracket'
import { TEAMS } from '@/data/teams'

interface Props {
  groupRankings: Record<string, string[]>   // group_code → [1st, 2nd, 3rd, 4th]
  picks: Record<string, string>              // match_id → predicted_winner team_code
  onPick: (matchId: string, teamCode: string) => void
  disabled?: boolean
}

const ROUNDS = ['R32', 'R16', 'QF', 'SF', 'FINAL'] as const

function resolveSlot(slotLabel: string, groupRankings: Record<string, string[]>): string | null {
  const winnerMatch = slotLabel.match(/^Group ([A-L]) Winner$/)
  if (winnerMatch) return groupRankings[winnerMatch[1]]?.[0] ?? null

  const runnerMatch = slotLabel.match(/^Group ([A-L]) Runner-up$/)
  if (runnerMatch) return groupRankings[runnerMatch[1]]?.[1] ?? null

  return null // best-3rd wildcards return null; show the label
}

function TeamSlot({
  label,
  teamCode,
  isSelected,
  onClick,
  disabled,
}: {
  label: string
  teamCode: string | null
  isSelected: boolean
  onClick?: () => void
  disabled: boolean
}) {
  const team = teamCode ? TEAMS[teamCode] : null
  return (
    <button
      onClick={!disabled && onClick ? onClick : undefined}
      disabled={disabled || !teamCode || !onClick}
      className={`flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs transition-colors
        ${isSelected ? 'bg-blue-900 border border-blue-500 text-blue-300' : 'bg-slate-800 border border-slate-700 text-slate-300'}
        ${!disabled && teamCode && onClick ? 'hover:bg-slate-700 cursor-pointer' : 'cursor-default'}
      `}
    >
      {team ? (
        <>
          <span>{team.flag}</span>
          <span className="font-medium">{team.name}</span>
        </>
      ) : (
        <span className="text-slate-500">{teamCode ? teamCode : label}</span>
      )}
      {isSelected && <span className="ml-auto text-blue-400 text-xs">✓</span>}
    </button>
  )
}

export function KnockoutBracket({ groupRankings, picks, onPick, disabled = false }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0 min-w-max">
        {ROUNDS.map((round) => {
          const matches = KNOCKOUT_MATCHES.filter(m =>
            round === 'FINAL' ? (m.round === 'FINAL' || m.round === '3RD') : m.round === round
          )
          const roundLabel = { R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-finals', SF: 'Semi-finals', FINAL: 'Final' }[round]

          return (
            <div key={round} className="flex flex-col" style={{ minWidth: 160 }}>
              <div className="text-xs text-slate-500 text-center py-2 font-medium">{roundLabel}</div>
              <div className={`flex flex-col flex-1 justify-around gap-2 px-2 pb-4`}>
                {matches.map(match => {
                  const teamA = resolveSlot(match.slotA, groupRankings) ?? picks[`R32-M${match.slotA}`] ?? null
                  const teamB = resolveSlot(match.slotB, groupRankings) ?? picks[`R32-M${match.slotB}`] ?? null
                  const winner = picks[match.id]

                  return (
                    <div key={match.id} className="flex flex-col gap-0.5 relative">
                      <TeamSlot
                        label={match.slotA}
                        teamCode={teamA}
                        isSelected={winner === teamA}
                        onClick={teamA ? () => onPick(match.id, teamA) : undefined}
                        disabled={disabled}
                      />
                      <div className="h-px bg-slate-700 mx-2" />
                      <TeamSlot
                        label={match.slotB}
                        teamCode={teamB}
                        isSelected={winner === teamB}
                        onClick={teamB ? () => onPick(match.id, teamB) : undefined}
                        disabled={disabled}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
