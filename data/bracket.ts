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
//   "Group X Winner"      — 1st place in group X
//   "Group X Runner-up"   — 2nd place in group X
//   "Best 3rd XXXXX"      — best 3rd-place wildcard from one of groups XXXXX (user picks)
//   "Winner MXX"          — winner of match MXX
//   "Loser MXX"           — loser of match MXX (used for 3rd-place match)

// Matches are ordered to match the visual bracket tree (top to bottom per round).
// R32 pairs that feed the same R16 slot are adjacent; R16 pairs feeding the same QF slot
// are adjacent; and so on — this lets justify-around centering align each match with
// its two upstream matches automatically.
export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  // Round of 32 — bracket order derived from M104 tree
  { id: 'M74',  round: 'R32', slotA: 'Group E Winner',    slotB: 'Best 3rd ABCDF',     feedsInto: 'M89',  feedsSlot: 'A' },
  { id: 'M77',  round: 'R32', slotA: 'Group I Winner',    slotB: 'Best 3rd CDFGH',     feedsInto: 'M89',  feedsSlot: 'B' },
  { id: 'M73',  round: 'R32', slotA: 'Group A Runner-up', slotB: 'Group B Runner-up',  feedsInto: 'M90',  feedsSlot: 'A' },
  { id: 'M75',  round: 'R32', slotA: 'Group F Winner',    slotB: 'Group C Runner-up',  feedsInto: 'M90',  feedsSlot: 'B' },
  { id: 'M83',  round: 'R32', slotA: 'Group K Runner-up', slotB: 'Group L Runner-up',  feedsInto: 'M93',  feedsSlot: 'A' },
  { id: 'M84',  round: 'R32', slotA: 'Group H Winner',    slotB: 'Group J Runner-up',  feedsInto: 'M93',  feedsSlot: 'B' },
  { id: 'M81',  round: 'R32', slotA: 'Group D Winner',    slotB: 'Best 3rd BEFIJ',     feedsInto: 'M94',  feedsSlot: 'A' },
  { id: 'M82',  round: 'R32', slotA: 'Group G Winner',    slotB: 'Best 3rd AEHIJ',     feedsInto: 'M94',  feedsSlot: 'B' },
  { id: 'M76',  round: 'R32', slotA: 'Group C Winner',    slotB: 'Group F Runner-up',  feedsInto: 'M91',  feedsSlot: 'A' },
  { id: 'M78',  round: 'R32', slotA: 'Group E Runner-up', slotB: 'Group I Runner-up',  feedsInto: 'M91',  feedsSlot: 'B' },
  { id: 'M79',  round: 'R32', slotA: 'Group A Winner',    slotB: 'Best 3rd CEFHI',     feedsInto: 'M92',  feedsSlot: 'A' },
  { id: 'M80',  round: 'R32', slotA: 'Group L Winner',    slotB: 'Best 3rd EHIJK',     feedsInto: 'M92',  feedsSlot: 'B' },
  { id: 'M86',  round: 'R32', slotA: 'Group J Winner',    slotB: 'Group H Runner-up',  feedsInto: 'M95',  feedsSlot: 'A' },
  { id: 'M88',  round: 'R32', slotA: 'Group D Runner-up', slotB: 'Group G Runner-up',  feedsInto: 'M95',  feedsSlot: 'B' },
  { id: 'M85',  round: 'R32', slotA: 'Group B Winner',    slotB: 'Best 3rd EFGIJ',     feedsInto: 'M96',  feedsSlot: 'A' },
  { id: 'M87',  round: 'R32', slotA: 'Group K Winner',    slotB: 'Best 3rd DEIJL',     feedsInto: 'M96',  feedsSlot: 'B' },
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

// Resolves a deterministic slot label to a team code using already-built upstream picks.
// Does not handle "Best 3rd" — that is handled separately in buildPicks.
function resolveSlot(
  slotLabel: string,
  groupRankings: Record<string, string[]>,
  built: Record<string, MatchPick>,
): string | null {
  const winnerOf = slotLabel.match(/^Group ([A-L]) Winner$/)
  if (winnerOf) return groupRankings[winnerOf[1]]?.[0] ?? null

  const runnerOf = slotLabel.match(/^Group ([A-L]) Runner-up$/)
  if (runnerOf) return groupRankings[runnerOf[1]]?.[1] ?? null

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
// qualifiers: matchId → Best 3rd qualifier team chosen by user
// winners: matchId → winner chosen by user
// teamA is always auto-populated; teamB is auto-populated except for Best 3rd slots.
// Winners that no longer match either resolved team are set to null automatically.
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
    if (match.slotB.startsWith('Best 3rd')) {
      const q = qualifiers[match.id] ?? null
      if (skipQualifierValidation) {
        teamB = q
      } else {
        const groups = match.slotB.replace('Best 3rd ', '').split('')
        const eligible = groups.map(g => groupRankings[g]?.[2]).filter((c): c is string => !!c)
        teamB = (q && eligible.includes(q)) ? q : null
      }
    } else {
      teamB = resolveSlot(match.slotB, groupRankings, result)
    }

    const w = winners[match.id] ?? null
    const winner = (w && (w === teamA || w === teamB)) ? w : null

    result[match.id] = { teamA, teamB, winner }
  }

  return result
}
