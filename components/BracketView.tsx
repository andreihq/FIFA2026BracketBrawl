'use client'
import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'
import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'
import { GROUP_CODES } from '@/data/groups'
import { buildPicks, buildQualifiers } from '@/data/bracket'

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

  // Parse WILDCARD_N records → set of advancing group codes
  const advancingThirds = new Set<string>()
  const winners: Record<string, string> = {}
  for (const p of knockoutPredictions) {
    if (p.match_id.startsWith('WILDCARD_')) advancingThirds.add(p.predicted_winner)
    else winners[p.match_id] = p.predicted_winner
  }

  const qualifiers = buildQualifiers(groupRankings, advancingThirds)
  const picks = buildPicks(groupRankings, qualifiers, winners)

  // correctPositions[groupCode] = set of 0-based indices where prediction matches actual
  const correctPositions: Record<string, Set<number>> = {}
  const actualGroupRankings: Record<string, string[]> = {}
  for (const r of actualResults) {
    if (r.result_type === 'group' && r.position !== null) {
      if (!actualGroupRankings[r.ref_id]) actualGroupRankings[r.ref_id] = []
      actualGroupRankings[r.ref_id][r.position - 1] = r.team_code

      const order = groupRankings[r.ref_id] ?? []
      const predictedIdx = order.indexOf(r.team_code)
      if (predictedIdx !== -1 && predictedIdx === r.position - 1) {
        if (!correctPositions[r.ref_id]) correctPositions[r.ref_id] = new Set()
        correctPositions[r.ref_id].add(predictedIdx)
      }
    }
  }

  const actualAdvancingThirds = new Set<string>()
  const actualWinners: Record<string, string> = {}
  for (const r of actualResults) {
    if (r.result_type === 'knockout') {
      if (r.ref_id.startsWith('WILDCARD_')) actualAdvancingThirds.add(r.team_code)
      else actualWinners[r.ref_id] = r.team_code
    }
  }
  const actualQualifiers = buildQualifiers(actualGroupRankings, actualAdvancingThirds)
  const correctPicks = buildPicks(actualGroupRankings, actualQualifiers, actualWinners, { skipQualifierValidation: true })

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
            advances={advancingThirds.has(g)}
            onAdvancesChange={() => {}}
            canAdvance={false}
            wildcardCorrect={advancingThirds.has(g) && actualAdvancingThirds.has(g)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="-mx-5">
      <KnockoutBracket
        picks={picks}
        onPick={() => {}}
        disabled
        correctPicks={correctPicks}
      />
    </div>
  )
}
