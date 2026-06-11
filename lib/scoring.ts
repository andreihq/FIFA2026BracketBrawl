import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'

export function computeScore(
  groupPredictions: GroupPrediction[],
  knockoutPredictions: KnockoutPrediction[],
  actualResults: ActualResult[]
): { groupPoints: number; knockoutPoints: number; total: number } {
  let groupPoints = 0
  let knockoutPoints = 0

  for (const result of actualResults) {
    if (result.result_type === 'group' && result.position !== null) {
      const hit = groupPredictions.find(
        p =>
          p.group_code === result.ref_id &&
          p.team_code === result.team_code &&
          p.predicted_pos === result.position
      )
      if (hit) groupPoints++
    } else if (result.result_type === 'knockout') {
      const hit = knockoutPredictions.find(
        p => p.match_id === result.ref_id && p.predicted_winner === result.team_code
      )
      if (hit) knockoutPoints++
    }
  }

  return { groupPoints, knockoutPoints, total: groupPoints + knockoutPoints }
}
