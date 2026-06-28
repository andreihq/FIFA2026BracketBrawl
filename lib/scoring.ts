import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'

const WILDCARD_PREFIX = 'WILDCARD_'

export function computeScore(
  groupPredictions: GroupPrediction[],
  knockoutPredictions: KnockoutPrediction[],
  actualResults: ActualResult[]
): { groupPoints: number; knockoutPoints: number; total: number } {
  let groupPoints = 0
  let knockoutPoints = 0

  // Group-stage ranks: 1 point per correctly guessed (group, team, rank).
  for (const result of actualResults) {
    if (result.result_type === 'group' && result.position !== null) {
      const hit = groupPredictions.find(
        p =>
          p.group_code === result.ref_id &&
          p.team_code === result.team_code &&
          p.predicted_pos === result.position
      )
      if (hit) groupPoints++
    }
  }

  // Wildcards (advancing 3rd-place groups): set-membership, fold into groupPoints.
  const predictedThirds = new Set(
    knockoutPredictions
      .filter(p => p.match_id.startsWith(WILDCARD_PREFIX))
      .map(p => p.predicted_winner)
  )
  const actualThirds = new Set(
    actualResults
      .filter(r => r.result_type === 'knockout' && r.ref_id.startsWith(WILDCARD_PREFIX))
      .map(r => r.team_code)
  )
  predictedThirds.forEach(group => {
    if (actualThirds.has(group)) groupPoints++
  })

  // Knockout progression: 1 point per real match (non-wildcard) where the
  // picked team won and therefore progressed.
  for (const result of actualResults) {
    if (result.result_type === 'knockout' && !result.ref_id.startsWith(WILDCARD_PREFIX)) {
      const hit = knockoutPredictions.find(
        p => p.match_id === result.ref_id && p.predicted_winner === result.team_code
      )
      if (hit) knockoutPoints++
    }
  }

  return { groupPoints, knockoutPoints, total: groupPoints + knockoutPoints }
}
