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

  it('assigns group A 3rd-place to M74 (first eligible match for A)', () => {
    // M74 eligible groups: A B C D F — A is alphabetically first
    const result = buildQualifiers(rankings, new Set(['A']))
    expect(result['M74']).toBe('RSA') // rankings.A[2]
    expect(Object.keys(result)).toHaveLength(1)
  })

  it('assigns group B 3rd-place to M74 when A is not selected', () => {
    // M74 eligible: A B C D F — B is first selected
    const result = buildQualifiers(rankings, new Set(['B']))
    expect(result['M74']).toBe('QAT') // rankings.B[2]
  })

  it('with A and B both selected, A goes to M74 and B goes to M81', () => {
    // M74: A,B,C,D,F eligible → A wins (alphabetical)
    // M77: C,D,F,G,H eligible → B not eligible, no candidate
    // M79: C,E,F,H,I eligible → B not eligible
    // M80: E,H,I,J,K eligible → B not eligible
    // M81: B,E,F,I,J eligible → B wins
    const result = buildQualifiers(rankings, new Set(['A', 'B']))
    expect(result['M74']).toBe('RSA')  // A → M74
    expect(result['M81']).toBe('QAT') // B → M81
    expect(Object.keys(result)).toHaveLength(2)
  })

  it('never assigns the same group twice', () => {
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'H', 'I']))
    const teamValues = Object.values(result)
    const uniqueTeams = new Set(teamValues)
    expect(teamValues.length).toBe(uniqueTeams.size)
  })

  it('fills all 8 slots when 8 groups with full coverage are selected', () => {
    // A,B,C,D,E,F,H,I covers all 8 match eligible sets
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'H', 'I']))
    expect(Object.keys(result)).toHaveLength(8)
  })
})
