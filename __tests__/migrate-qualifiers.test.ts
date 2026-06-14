import { migrateQualifiers } from '../scripts/migrate-qualifiers'

describe('migrateQualifiers', () => {
  // Test 1: Empty input → empty Set
  it('returns empty Set for empty input', () => {
    const result = migrateQualifiers([])
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  // Test 2: Single row, team code maps correctly to group
  it('maps a single team code to its group letter', () => {
    const result = migrateQualifiers([{ predicted_winner: 'RSA' }])
    expect(result).toEqual(new Set(['A']))
  })

  // Test 3: Multiple rows from different groups → Set of group letters
  it('maps multiple rows from different groups to their group letters', () => {
    const rows = [
      { predicted_winner: 'RSA' },  // A
      { predicted_winner: 'MAR' },  // C
      { predicted_winner: 'GER' },  // E
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A', 'C', 'E']))
  })

  // Test 4: Duplicate groups (two teams from same group) → deduplicated
  it('deduplicates groups when multiple teams are from the same group', () => {
    const rows = [
      { predicted_winner: 'CZE' },  // A
      { predicted_winner: 'MEX' },  // A (duplicate group)
      { predicted_winner: 'BRA' },  // C
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A', 'C']))
    expect(result.size).toBe(2)
  })

  // Test 5: Unknown team code → ignored
  it('ignores unknown team codes', () => {
    const rows = [
      { predicted_winner: 'XYZ' },  // unknown
      { predicted_winner: 'RSA' },  // A
      { predicted_winner: 'UNKNOWN' }, // unknown
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A']))
  })

  // Test 6: Full 8-slot migration (8 rows from different groups A-H)
  it('handles 8 rows from different groups A-H', () => {
    const rows = [
      { predicted_winner: 'RSA' },  // A
      { predicted_winner: 'CAN' },  // B
      { predicted_winner: 'MAR' },  // C
      { predicted_winner: 'USA' },  // D
      { predicted_winner: 'GER' },  // E
      { predicted_winner: 'NED' },  // F
      { predicted_winner: 'BEL' },  // G
      { predicted_winner: 'ESP' },  // H
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']))
    expect(result.size).toBe(8)
  })

  // Test 7: Bracket "7121194f" — groups {A, C, E, F, H, I, J, L}
  it('migrates bracket 7121194f: groups A, C, E, F, H, I, J, L', () => {
    const rows = [
      { predicted_winner: 'RSA' },  // A
      { predicted_winner: 'MAR' },  // C
      { predicted_winner: 'ECU' },  // E
      { predicted_winner: 'JPN' },  // F
      { predicted_winner: 'ESP' },  // H
      { predicted_winner: 'FRA' },  // I
      { predicted_winner: 'ARG' },  // J
      { predicted_winner: 'GHA' },  // L
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A', 'C', 'E', 'F', 'H', 'I', 'J', 'L']))
    expect(result.size).toBe(8)
  })

  // Test 8: Bracket "cb2c0409" — groups {A, B, D, E, F, G, H, J}
  it('migrates bracket cb2c0409: groups A, B, D, E, F, G, H, J', () => {
    const rows = [
      { predicted_winner: 'CZE' },  // A
      { predicted_winner: 'SUI' },  // B
      { predicted_winner: 'TUR' },  // D
      { predicted_winner: 'CIV' },  // E
      { predicted_winner: 'SWE' },  // F
      { predicted_winner: 'NZL' },  // G
      { predicted_winner: 'URU' },  // H
      { predicted_winner: 'ALG' },  // J
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A', 'B', 'D', 'E', 'F', 'G', 'H', 'J']))
    expect(result.size).toBe(8)
  })

  // Test 9: Bracket "d806341e" — groups {A, C, D, E, F, I, J, L}
  it('migrates bracket d806341e: groups A, C, D, E, F, I, J, L', () => {
    const rows = [
      { predicted_winner: 'KOR' },  // A
      { predicted_winner: 'SCO' },  // C
      { predicted_winner: 'PAR' },  // D
      { predicted_winner: 'CUW' },  // E
      { predicted_winner: 'TUN' },  // F
      { predicted_winner: 'SEN' },  // I
      { predicted_winner: 'AUT' },  // J
      { predicted_winner: 'ENG' },  // L
    ]
    const result = migrateQualifiers(rows)
    expect(result).toEqual(new Set(['A', 'C', 'D', 'E', 'F', 'I', 'J', 'L']))
    expect(result.size).toBe(8)
  })
})
