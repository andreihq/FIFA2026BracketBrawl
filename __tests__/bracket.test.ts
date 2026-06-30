import { buildQualifiers, isKnockoutWinnerCorrect, teamsEliminatedInRound } from '@/data/bracket'

// Rankings mirrors the actual GROUPS data (index 2 = 3rd place)
const rankings: Record<string, string[]> = {
  A: ['CZE', 'MEX', 'RSA', 'KOR'],
  B: ['BIH', 'CAN', 'QAT', 'SUI'],
  C: ['BRA', 'HAI', 'MAR', 'SCO'],
  D: ['AUS', 'PAR', 'TUR', 'USA'],
  E: ['CIV', 'CUW', 'ECU', 'GER'],
  F: ['JPN', 'NED', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['CPV', 'ESP', 'KSA', 'URU'],
  I: ['FRA', 'IRQ', 'NOR', 'SEN'],
  J: ['ALG', 'ARG', 'AUT', 'JOR'],
  K: ['COD', 'COL', 'POR', 'UZB'],
  L: ['CRO', 'ENG', 'GHA', 'PAN'],
}

describe('buildQualifiers', () => {
  it('returns empty object when no groups selected', () => {
    expect(buildQualifiers(rankings, new Set())).toEqual({})
  })

  it('returns empty object when fewer than 8 groups selected', () => {
    expect(buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']))).toEqual({})
  })

  it('looks up A B C D E F G H correctly from Annex C', () => {
    // CSV row: A B C D E F G H → M79:H M85:G M81:B M74:C M82:A M77:F M87:D M80:E
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']))
    expect(result['M74']).toBe('MAR')  // group C 3rd place
    expect(result['M77']).toBe('SWE')  // group F 3rd place
    expect(result['M79']).toBe('KSA')  // group H 3rd place
    expect(result['M80']).toBe('ECU')  // group E 3rd place
    expect(result['M81']).toBe('QAT')  // group B 3rd place
    expect(result['M82']).toBe('RSA')  // group A 3rd place
    expect(result['M85']).toBe('IRN')  // group G 3rd place
    expect(result['M87']).toBe('TUR')  // group D 3rd place
    expect(Object.keys(result)).toHaveLength(8)
  })

  it('looks up A B C D E F H I correctly from Annex C', () => {
    // CSV row: A B C D E F H I → M79:H M85:E M81:B M74:C M82:A M77:F M87:D M80:I
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'H', 'I']))
    expect(result['M74']).toBe('MAR')  // group C 3rd place
    expect(result['M77']).toBe('SWE')  // group F 3rd place
    expect(result['M79']).toBe('KSA')  // group H 3rd place
    expect(result['M80']).toBe('NOR')  // group I 3rd place
    expect(result['M81']).toBe('QAT')  // group B 3rd place
    expect(result['M82']).toBe('RSA')  // group A 3rd place
    expect(result['M85']).toBe('ECU')  // group E 3rd place
    expect(result['M87']).toBe('TUR')  // group D 3rd place
    expect(Object.keys(result)).toHaveLength(8)
  })

  it('never assigns the same team twice', () => {
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']))
    const teamValues = Object.values(result)
    const uniqueTeams = new Set(teamValues)
    expect(teamValues.length).toBe(uniqueTeams.size)
  })

  it('fills all 8 slots for a valid 8-group combination', () => {
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']))
    expect(Object.keys(result)).toHaveLength(8)
  })

  it('returns empty object for an unknown combination (not in Annex C)', () => {
    // Any valid 8-from-12 combo IS in Annex C, so this tests a fabricated invalid key
    const fakeSet = new Set(['A', 'A', 'B', 'C', 'D', 'E', 'F', 'G']) // only 7 unique
    expect(buildQualifiers(rankings, fakeSet)).toEqual({})
  })
})

describe('isKnockoutWinnerCorrect', () => {
  // Green highlighting marks the WINNER of a match inside that match's own card,
  // when the predicted winner matches the actual winner. It mirrors scoring:
  // one point per correctly predicted match winner.

  it('marks an R32 winner correct in its own match (the CAN vs SA case)', () => {
    // Canada won the R32 match, so Canada is highlighted in the R32 card itself,
    // not one column to the right in R16.
    expect(isKnockoutWinnerCorrect('CAN', 'CAN')).toBe(true)
  })

  it('marks any-round winner correct when the predicted winner matches the actual winner', () => {
    expect(isKnockoutWinnerCorrect('MAR', 'MAR')).toBe(true)
  })

  it('does not mark a winner correct when the prediction differs from the actual winner', () => {
    expect(isKnockoutWinnerCorrect('MAR', 'BRA')).toBe(false)
  })

  it('does not mark a winner correct when there is no predicted winner', () => {
    expect(isKnockoutWinnerCorrect(null, 'BRA')).toBe(false)
  })

  it('does not mark a winner correct when the actual winner is unknown', () => {
    expect(isKnockoutWinnerCorrect('BRA', undefined)).toBe(false)
  })
})

describe('teamsEliminatedInRound', () => {
  // Red highlighting keys off REAL elimination at a round, not the bracket slot a
  // player routed a team through. A team that lost a round-R match is "out at
  // round R" — even if the player predicted it in a different round-R match. A
  // team still alive (won its round-R match) or one that never reached round R is
  // never flagged, so a wrong upstream prediction alone does not paint it red.

  const pick = (teamA: string | null, teamB: string | null, winner: string | null) => ({ teamA, teamB, winner })

  it('includes the loser of a decided match in that round (GER vs TUR case)', () => {
    const actual = { M74: pick('GER', 'TUR', 'TUR') }
    const out = teamsEliminatedInRound('R32', actual)
    expect(out.has('GER')).toBe(true)
    expect(out.has('TUR')).toBe(false)
  })

  it('aggregates losers across every match of the round (different-match elimination)', () => {
    const actual = { M74: pick('GER', 'TUR', 'TUR'), M77: pick('FRA', 'ENG', 'FRA') }
    const out = teamsEliminatedInRound('R32', actual)
    expect(out.has('GER')).toBe(true)
    expect(out.has('ENG')).toBe(true)
    expect(out.has('FRA')).toBe(false)
    expect(out.has('TUR')).toBe(false)
  })

  it('ignores matches that have not been decided yet', () => {
    expect(teamsEliminatedInRound('R32', { M74: pick('GER', 'TUR', null) }).size).toBe(0)
  })

  it('does not report a team eliminated in a different round (the misrouted-pick bug)', () => {
    // GER actually went out in R32; it must NOT be flagged red in an R16 card,
    // because it never played at R16 at all.
    const actual = { M74: pick('GER', 'TUR', 'TUR') }
    expect(teamsEliminatedInRound('R16', actual).has('GER')).toBe(false)
  })

  it('returns an empty set when there are no results', () => {
    expect(teamsEliminatedInRound('R32', {}).size).toBe(0)
  })
})
