import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'
import type { GroupPrediction, KnockoutPrediction } from '@/types'
import { GROUP_CODES } from '@/data/groups'

interface Props {
  groupPredictions: GroupPrediction[]
  knockoutPredictions: KnockoutPrediction[]
  tab: 'groups' | 'knockouts'
}

export function BracketView({ groupPredictions, knockoutPredictions, tab }: Props) {
  const groupRankings: Record<string, string[]> = {}
  for (const g of GROUP_CODES) {
    groupRankings[g] = groupPredictions
      .filter(p => p.group_code === g)
      .sort((a, b) => a.predicted_pos - b.predicted_pos)
      .map(p => p.team_code)
  }

  const picks: Record<string, string> = {}
  for (const p of knockoutPredictions) picks[p.match_id] = p.predicted_winner

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
          />
        ))}
      </div>
    )
  }

  const thirdPicks: Record<string, string> = {}
  for (const p of knockoutPredictions) {
    if (p.match_id.endsWith(':3rd')) thirdPicks[p.match_id.slice(0, -4)] = p.predicted_winner
  }

  return (
    <KnockoutBracket
      groupRankings={groupRankings}
      picks={picks}
      onPick={() => {}}
      thirdPicks={thirdPicks}
      onThirdPick={() => {}}
      disabled
    />
  )
}
