import { computeScore } from '@/lib/scoring'
import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'

const groupPreds: GroupPrediction[] = [
  { id: '1', bracket_id: 'b1', group_code: 'A', team_code: 'BRA', predicted_pos: 1 },
  { id: '2', bracket_id: 'b1', group_code: 'A', team_code: 'ARG', predicted_pos: 2 },
  { id: '3', bracket_id: 'b1', group_code: 'A', team_code: 'MEX', predicted_pos: 3 },
]

const koPreds: KnockoutPrediction[] = [
  { id: '4', bracket_id: 'b1', match_id: 'R32-M1', predicted_winner: 'BRA' },
  { id: '5', bracket_id: 'b1', match_id: 'FINAL',  predicted_winner: 'ARG' },
]

describe('computeScore', () => {
  it('returns zero when no results entered', () => {
    expect(computeScore(groupPreds, koPreds, [])).toEqual({ groupPoints: 0, knockoutPoints: 0, total: 0 })
  })

  it('awards 1pt for correct group position', () => {
    const results: ActualResult[] = [
      { id: 'r1', result_type: 'group', ref_id: 'A', team_code: 'BRA', position: 1, entered_at: '' },
    ]
    expect(computeScore(groupPreds, koPreds, results)).toEqual({ groupPoints: 1, knockoutPoints: 0, total: 1 })
  })

  it('does not award points for wrong position', () => {
    const results: ActualResult[] = [
      { id: 'r1', result_type: 'group', ref_id: 'A', team_code: 'BRA', position: 2, entered_at: '' },
    ]
    expect(computeScore(groupPreds, koPreds, results)).toEqual({ groupPoints: 0, knockoutPoints: 0, total: 0 })
  })

  it('awards 1pt for correct knockout winner', () => {
    const results: ActualResult[] = [
      { id: 'r2', result_type: 'knockout', ref_id: 'R32-M1', team_code: 'BRA', position: null, entered_at: '' },
    ]
    expect(computeScore(groupPreds, koPreds, results)).toEqual({ groupPoints: 0, knockoutPoints: 1, total: 1 })
  })

  it('accumulates group and knockout points correctly', () => {
    const results: ActualResult[] = [
      { id: 'r1', result_type: 'group',    ref_id: 'A',      team_code: 'BRA', position: 1,    entered_at: '' },
      { id: 'r2', result_type: 'group',    ref_id: 'A',      team_code: 'ARG', position: 2,    entered_at: '' },
      { id: 'r3', result_type: 'knockout', ref_id: 'R32-M1', team_code: 'BRA', position: null, entered_at: '' },
      { id: 'r4', result_type: 'knockout', ref_id: 'FINAL',  team_code: 'FRA', position: null, entered_at: '' },
    ]
    expect(computeScore(groupPreds, koPreds, results)).toEqual({ groupPoints: 2, knockoutPoints: 1, total: 3 })
  })
})
