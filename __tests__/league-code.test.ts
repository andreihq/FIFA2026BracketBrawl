import { generateLeagueCode, isValidLeagueCode } from '@/lib/league-code'

describe('generateLeagueCode', () => {
  it('returns a string starting with FIFA-', () => {
    expect(generateLeagueCode()).toMatch(/^FIFA-/)
  })

  it('returns 9 characters total (FIFA- + 4)', () => {
    expect(generateLeagueCode()).toHaveLength(9)
  })

  it('suffix contains only unambiguous alphanumeric chars', () => {
    const suffix = generateLeagueCode().slice(5)
    expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/)
  })

  it('generates unique codes across 1000 calls', () => {
    const codes = new Set(Array.from({ length: 1000 }, generateLeagueCode))
    expect(codes.size).toBeGreaterThan(990)
  })
})

describe('isValidLeagueCode', () => {
  it('accepts a valid code', () => {
    expect(isValidLeagueCode('FIFA-4X9K')).toBe(true)
  })

  it('rejects wrong prefix', () => {
    expect(isValidLeagueCode('ABCD-1234')).toBe(false)
  })

  it('rejects wrong length', () => {
    expect(isValidLeagueCode('FIFA-12')).toBe(false)
  })
})
