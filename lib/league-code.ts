const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_REGEX = /^FIFA-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/

export function generateLeagueCode(): string {
  const suffix = Array.from(
    { length: 4 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
  return `FIFA-${suffix}`
}

export function isValidLeagueCode(code: string): boolean {
  return CODE_REGEX.test(code)
}
