import { buildQualifiers } from '@/data/bracket'

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
