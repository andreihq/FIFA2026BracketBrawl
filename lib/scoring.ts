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

  // Wildcards (advancing 3rd-place teams), folded into groupPoints. A pick is
  // correct only when the SPECIFIC team the player nominated — their predicted
  // 3rd-place team of the group — is the team that actually finished 3rd AND
  // advanced as a wildcard. Group-level membership alone is not enough: if the
  // nominated team instead placed 1st/2nd (advanced directly) or 4th (out), the
  // pick is wrong even though some team from that group advanced.
  const predictedThirdGroups = new Set(
    knockoutPredictions
      .filter(p => p.match_id.startsWith(WILDCARD_PREFIX))
      .map(p => p.predicted_winner)
  )
  const actualAdvancingGroups = new Set(
    actualResults
      .filter(r => r.result_type === 'knockout' && r.ref_id.startsWith(WILDCARD_PREFIX))
      .map(r => r.team_code)
  )
  const predicted3rd = (group: string) =>
    groupPredictions.find(p => p.group_code === group && p.predicted_pos === 3)?.team_code ?? null
  const actual3rd = (group: string) =>
    actualResults.find(
      r => r.result_type === 'group' && r.ref_id === group && r.position === 3
    )?.team_code ?? null

  predictedThirdGroups.forEach(group => {
    if (!actualAdvancingGroups.has(group)) return
    const nominated = predicted3rd(group)
    if (nominated !== null && nominated === actual3rd(group)) groupPoints++
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
