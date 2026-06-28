import { ANNEX_C } from './annex-c'

export interface KnockoutMatch {
  id: string
  round: 'R32' | 'R16' | 'QF' | 'SF' | '3RD' | 'FINAL'
  slotA: string
  slotB: string
  feedsInto?: string
  feedsSlot?: 'A' | 'B'
}

export interface MatchPick {
  teamA: string | null
  teamB: string | null
  winner: string | null
}

// Slot label conventions:
//   "1X"        — 1st place (winner) of group X
//   "2X"        — 2nd place (runner-up) of group X
//   "W"         — 3rd-place wildcard (assigned via Annex C lookup table)
//   "Winner MXX" — winner of match MXX
//   "Loser MXX"  — loser of match MXX (3rd-place match only)

// Matches are ordered to match the visual bracket tree (top to bottom per round).
export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  // Round of 32 — bracket order derived from M104 tree
  { id: 'M74',  round: 'R32', slotA: '1E', slotB: 'W',   feedsInto: 'M89',  feedsSlot: 'A' },
  { id: 'M77',  round: 'R32', slotA: '1I', slotB: 'W',   feedsInto: 'M89',  feedsSlot: 'B' },
  { id: 'M73',  round: 'R32', slotA: '2A', slotB: '2B',  feedsInto: 'M90',  feedsSlot: 'A' },
  { id: 'M75',  round: 'R32', slotA: '1F', slotB: '2C',  feedsInto: 'M90',  feedsSlot: 'B' },
  { id: 'M83',  round: 'R32', slotA: '2K', slotB: '2L',  feedsInto: 'M93',  feedsSlot: 'A' },
  { id: 'M84',  round: 'R32', slotA: '1H', slotB: '2J',  feedsInto: 'M93',  feedsSlot: 'B' },
  { id: 'M81',  round: 'R32', slotA: '1D', slotB: 'W',   feedsInto: 'M94',  feedsSlot: 'A' },
  { id: 'M82',  round: 'R32', slotA: '1G', slotB: 'W',   feedsInto: 'M94',  feedsSlot: 'B' },
  { id: 'M76',  round: 'R32', slotA: '1C', slotB: '2F',  feedsInto: 'M91',  feedsSlot: 'A' },
  { id: 'M78',  round: 'R32', slotA: '2E', slotB: '2I',  feedsInto: 'M91',  feedsSlot: 'B' },
  { id: 'M79',  round: 'R32', slotA: '1A', slotB: 'W',   feedsInto: 'M92',  feedsSlot: 'A' },
  { id: 'M80',  round: 'R32', slotA: '1L', slotB: 'W',   feedsInto: 'M92',  feedsSlot: 'B' },
  { id: 'M86',  round: 'R32', slotA: '1J', slotB: '2H',  feedsInto: 'M95',  feedsSlot: 'A' },
  { id: 'M88',  round: 'R32', slotA: '2D', slotB: '2G',  feedsInto: 'M95',  feedsSlot: 'B' },
  { id: 'M85',  round: 'R32', slotA: '1B', slotB: 'W',   feedsInto: 'M96',  feedsSlot: 'A' },
  { id: 'M87',  round: 'R32', slotA: '1K', slotB: 'W',   feedsInto: 'M96',  feedsSlot: 'B' },
  // Round of 16 — bracket order
  { id: 'M89',  round: 'R16', slotA: 'Winner M74', slotB: 'Winner M77', feedsInto: 'M97',  feedsSlot: 'A' },
  { id: 'M90',  round: 'R16', slotA: 'Winner M73', slotB: 'Winner M75', feedsInto: 'M97',  feedsSlot: 'B' },
  { id: 'M93',  round: 'R16', slotA: 'Winner M83', slotB: 'Winner M84', feedsInto: 'M98',  feedsSlot: 'A' },
  { id: 'M94',  round: 'R16', slotA: 'Winner M81', slotB: 'Winner M82', feedsInto: 'M98',  feedsSlot: 'B' },
  { id: 'M91',  round: 'R16', slotA: 'Winner M76', slotB: 'Winner M78', feedsInto: 'M99',  feedsSlot: 'A' },
  { id: 'M92',  round: 'R16', slotA: 'Winner M79', slotB: 'Winner M80', feedsInto: 'M99',  feedsSlot: 'B' },
  { id: 'M95',  round: 'R16', slotA: 'Winner M86', slotB: 'Winner M88', feedsInto: 'M100', feedsSlot: 'A' },
  { id: 'M96',  round: 'R16', slotA: 'Winner M85', slotB: 'Winner M87', feedsInto: 'M100', feedsSlot: 'B' },
  // Quarter-finals — bracket order
  { id: 'M97',  round: 'QF', slotA: 'Winner M89', slotB: 'Winner M90', feedsInto: 'M101', feedsSlot: 'A' },
  { id: 'M98',  round: 'QF', slotA: 'Winner M93', slotB: 'Winner M94', feedsInto: 'M101', feedsSlot: 'B' },
  { id: 'M99',  round: 'QF', slotA: 'Winner M91', slotB: 'Winner M92', feedsInto: 'M102', feedsSlot: 'A' },
  { id: 'M100', round: 'QF', slotA: 'Winner M95', slotB: 'Winner M96', feedsInto: 'M102', feedsSlot: 'B' },
  // Semi-finals
  { id: 'M101', round: 'SF', slotA: 'Winner M97',  slotB: 'Winner M98',  feedsInto: 'M104', feedsSlot: 'A' },
  { id: 'M102', round: 'SF', slotA: 'Winner M99',  slotB: 'Winner M100', feedsInto: 'M104', feedsSlot: 'B' },
  // Final & 3rd-place
  { id: 'M104', round: 'FINAL', slotA: 'Winner M101', slotB: 'Winner M102' },
  { id: 'M103', round: '3RD',   slotA: 'Loser M101',  slotB: 'Loser M102' },
]

export const MATCH_IDS = KNOCKOUT_MATCHES.map(m => m.id)

// The green highlight marks the WINNER of a match inside that match's own card,
// when the player's predicted winner matches the actual winner. The highlight
// therefore lives in the column where the match is played — an R32 winner is
// highlighted in the R32 column, not one column to the right in R16. This
// mirrors knockout scoring: one point per correctly predicted match winner.
export function isKnockoutWinnerCorrect(
  predictedWinner: string | null | undefined,
  actualWinner: string | null | undefined,
): boolean {
  return !!predictedWinner && predictedWinner === actualWinner
}

// Resolves a deterministic slot label to a team code using already-built upstream picks.
// 'W' (wildcard) slots are handled separately in buildPicks.
function resolveSlot(
  slotLabel: string,
  groupRankings: Record<string, string[]>,
  built: Record<string, MatchPick>,
): string | null {
  const winner = slotLabel.match(/^1([A-L])$/)
  if (winner) return groupRankings[winner[1]]?.[0] ?? null

  const runner = slotLabel.match(/^2([A-L])$/)
  if (runner) return groupRankings[runner[1]]?.[1] ?? null

  const prevWinner = slotLabel.match(/^Winner (M\d+)$/)
  if (prevWinner) return built[prevWinner[1]]?.winner ?? null

  const prevLoser = slotLabel.match(/^Loser (M\d+)$/)
  if (prevLoser) {
    const prev = built[prevLoser[1]]
    if (!prev?.winner) return null
    return prev.winner === prev.teamA ? prev.teamB : prev.teamA
  }

  return null
}

// Builds the full bracket state from user inputs.
// qualifiers: matchId → wildcard team code (from buildQualifiers)
// winners: matchId → winner chosen by user
// Winners that no longer match either resolved team are cleared automatically.
export function buildPicks(
  groupRankings: Record<string, string[]>,
  qualifiers: Record<string, string>,
  winners: Record<string, string>,
  { skipQualifierValidation = false } = {},
): Record<string, MatchPick> {
  const result: Record<string, MatchPick> = {}

  for (const match of KNOCKOUT_MATCHES) {
    const teamA = resolveSlot(match.slotA, groupRankings, result)

    let teamB: string | null
    if (match.slotB === 'W') {
      teamB = qualifiers[match.id] ?? null
    } else {
      teamB = resolveSlot(match.slotB, groupRankings, result)
    }

    const w = winners[match.id] ?? null
    const winner = (w && (w === teamA || w === teamB)) ? w : null

    result[match.id] = { teamA, teamB, winner }
  }

  return result
}

// Looks up the official FIFA Annex C table to determine which group's 3rd-place
// team plays in each wildcard R32 match, given the set of 8 advancing groups.
export function buildQualifiers(
  groupRankings: Record<string, string[]>,
  advancingThirds: Set<string>,
): Record<string, string> {
  if (advancingThirds.size !== 8) return {}

  const key = Array.from(advancingThirds).sort().join(' ')
  const assignment = ANNEX_C[key]
  if (!assignment) return {}

  const result: Record<string, string> = {}
  for (const [matchId, groupCode] of Object.entries(assignment)) {
    const team = groupRankings[groupCode]?.[2]
    if (team) result[matchId] = team
  }
  return result
}
