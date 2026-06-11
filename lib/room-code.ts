const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_REGEX = /^FIFA-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/

export function generateRoomCode(): string {
  const suffix = Array.from(
    { length: 4 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
  return `FIFA-${suffix}`
}

export function isValidRoomCode(code: string): boolean {
  return CODE_REGEX.test(code)
}
