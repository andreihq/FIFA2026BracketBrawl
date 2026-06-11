import { generateRoomCode, isValidRoomCode } from '@/lib/room-code'

describe('generateRoomCode', () => {
  it('returns a string starting with FIFA-', () => {
    expect(generateRoomCode()).toMatch(/^FIFA-/)
  })

  it('returns 9 characters total (FIFA- + 4)', () => {
    expect(generateRoomCode()).toHaveLength(9)
  })

  it('suffix contains only unambiguous alphanumeric chars', () => {
    const suffix = generateRoomCode().slice(5)
    expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/)
  })

  it('generates unique codes across 1000 calls', () => {
    const codes = new Set(Array.from({ length: 1000 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(990)
  })
})

describe('isValidRoomCode', () => {
  it('accepts a valid code', () => {
    expect(isValidRoomCode('FIFA-4X9K')).toBe(true)
  })

  it('rejects wrong prefix', () => {
    expect(isValidRoomCode('ABCD-1234')).toBe(false)
  })

  it('rejects wrong length', () => {
    expect(isValidRoomCode('FIFA-12')).toBe(false)
  })
})
