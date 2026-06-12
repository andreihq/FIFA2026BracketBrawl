'use client'
import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'
import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'
import { GROUP_CODES } from '@/data/groups'

interface Props {
  groupPredictions: GroupPrediction[]
  knockoutPredictions: KnockoutPrediction[]
  actualResults?: ActualResult[]
  tab: 'groups' | 'knockouts'
}

export function BracketView({ groupPredictions, knockoutPredictions, actualResults = [], tab }: Props) {
  const groupRankings: Record<string, string[]> = {}
  for (const g of GROUP_CODES) {
    groupRankings[g] = groupPredictions
      .filter(p => p.group_code === g)
      .sort((a, b) => a.predicted_pos - b.predicted_pos)
      .map(p => p.team_code)
  }

  const picks: Record<string, string> = {}
  const thirdPicks: Record<string, string> = {}
  for (const p of knockoutPredictions) {
    if (p.match_id.endsWith(':3rd')) {
      thirdPicks[p.match_id.slice(0, -4)] = p.predicted_winner
    } else {
      picks[p.match_id] = p.predicted_winner
    }
  }

  // correctPositions[groupCode] = Set of 0-based indices where prediction matches result
  const correctPositions: Record<string, Set<number>> = {}
  for (const r of actualResults) {
    if (r.result_type === 'group' && r.position !== null) {
      const order = groupRankings[r.ref_id] ?? []
      const predictedIdx = order.indexOf(r.team_code)
      if (predictedIdx !== -1 && predictedIdx === r.position - 1) {
        if (!correctPositions[r.ref_id]) correctPositions[r.ref_id] = new Set()
        correctPositions[r.ref_id].add(predictedIdx)
      }
    }
  }

  // correctPicks[matchId] = actual winning team code (includes :3rd keys)
  const correctPicks: Record<string, string> = {}
  for (const r of actualResults) {
    if (r.result_type === 'knockout') correctPicks[r.ref_id] = r.team_code
  }

  if (tab === 'groups') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUP_CODES.map(g => (
          <GroupStageEditor
            key={g}
            groupCode={g}
            order={groupRankings[g] ?? []}
            onChange={() => {}}
            disabled
            correctPositions={correctPositions[g]}
          />
        ))}
      </div>
    )
  }

  return (
    <KnockoutBracket
      groupRankings={groupRankings}
      picks={picks}
      onPick={() => {}}
      thirdPicks={thirdPicks}
      onThirdPick={() => {}}
      disabled
      correctPicks={correctPicks}
    />
  )
}
