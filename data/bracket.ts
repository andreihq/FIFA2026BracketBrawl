// Knockout bracket wiring for FIFA 2026.
// Verify R32 slot labels against the official FIFA 2026 bracket draw.
export interface KnockoutMatch {
  id: string           // "R32-M1", "R16-M1", "QF-M1", "SF-M1", "3RD", "FINAL"
  round: 'R32' | 'R16' | 'QF' | 'SF' | '3RD' | 'FINAL'
  slotA: string        // e.g. "Group A Winner" or "Best 3rd (A/B/C/D)"
  slotB: string
  feedsInto?: string   // match id this winner feeds into
  feedsSlot?: 'A' | 'B'
}

export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  // Round of 32 — verify slot labels against official draw
  { id: 'R32-M1',  round: 'R32', slotA: 'Group A Winner',     slotB: 'Group B Runner-up',   feedsInto: 'R16-M1', feedsSlot: 'A' },
  { id: 'R32-M2',  round: 'R32', slotA: 'Group C Winner',     slotB: 'Group D Runner-up',   feedsInto: 'R16-M1', feedsSlot: 'B' },
  { id: 'R32-M3',  round: 'R32', slotA: 'Group E Winner',     slotB: 'Group F Runner-up',   feedsInto: 'R16-M2', feedsSlot: 'A' },
  { id: 'R32-M4',  round: 'R32', slotA: 'Group G Winner',     slotB: 'Group H Runner-up',   feedsInto: 'R16-M2', feedsSlot: 'B' },
  { id: 'R32-M5',  round: 'R32', slotA: 'Group I Winner',     slotB: 'Group J Runner-up',   feedsInto: 'R16-M3', feedsSlot: 'A' },
  { id: 'R32-M6',  round: 'R32', slotA: 'Group K Winner',     slotB: 'Group L Runner-up',   feedsInto: 'R16-M3', feedsSlot: 'B' },
  { id: 'R32-M7',  round: 'R32', slotA: 'Group B Winner',     slotB: 'Group A Runner-up',   feedsInto: 'R16-M4', feedsSlot: 'A' },
  { id: 'R32-M8',  round: 'R32', slotA: 'Group D Winner',     slotB: 'Group C Runner-up',   feedsInto: 'R16-M4', feedsSlot: 'B' },
  { id: 'R32-M9',  round: 'R32', slotA: 'Group F Winner',     slotB: 'Group E Runner-up',   feedsInto: 'R16-M5', feedsSlot: 'A' },
  { id: 'R32-M10', round: 'R32', slotA: 'Group H Winner',     slotB: 'Group G Runner-up',   feedsInto: 'R16-M5', feedsSlot: 'B' },
  { id: 'R32-M11', round: 'R32', slotA: 'Group J Winner',     slotB: 'Group I Runner-up',   feedsInto: 'R16-M6', feedsSlot: 'A' },
  { id: 'R32-M12', round: 'R32', slotA: 'Group L Winner',     slotB: 'Group K Runner-up',   feedsInto: 'R16-M6', feedsSlot: 'B' },
  { id: 'R32-M13', round: 'R32', slotA: 'Best 3rd (A/B/C/D)', slotB: 'Best 3rd (E/F/G/H)', feedsInto: 'R16-M7', feedsSlot: 'A' },
  { id: 'R32-M14', round: 'R32', slotA: 'Best 3rd (I/J/K/L)', slotB: 'Best 3rd (A/B/C/D)', feedsInto: 'R16-M7', feedsSlot: 'B' },
  { id: 'R32-M15', round: 'R32', slotA: 'Best 3rd (E/F/G/H)', slotB: 'Best 3rd (I/J/K/L)', feedsInto: 'R16-M8', feedsSlot: 'A' },
  { id: 'R32-M16', round: 'R32', slotA: 'Best 3rd (A/B/C/D)', slotB: 'Best 3rd (E/F/G/H)', feedsInto: 'R16-M8', feedsSlot: 'B' },
  // Round of 16
  { id: 'R16-M1', round: 'R16', slotA: 'Winner R32-M1', slotB: 'Winner R32-M2', feedsInto: 'QF-M1', feedsSlot: 'A' },
  { id: 'R16-M2', round: 'R16', slotA: 'Winner R32-M3', slotB: 'Winner R32-M4', feedsInto: 'QF-M1', feedsSlot: 'B' },
  { id: 'R16-M3', round: 'R16', slotA: 'Winner R32-M5', slotB: 'Winner R32-M6', feedsInto: 'QF-M2', feedsSlot: 'A' },
  { id: 'R16-M4', round: 'R16', slotA: 'Winner R32-M7', slotB: 'Winner R32-M8', feedsInto: 'QF-M2', feedsSlot: 'B' },
  { id: 'R16-M5', round: 'R16', slotA: 'Winner R32-M9',  slotB: 'Winner R32-M10', feedsInto: 'QF-M3', feedsSlot: 'A' },
  { id: 'R16-M6', round: 'R16', slotA: 'Winner R32-M11', slotB: 'Winner R32-M12', feedsInto: 'QF-M3', feedsSlot: 'B' },
  { id: 'R16-M7', round: 'R16', slotA: 'Winner R32-M13', slotB: 'Winner R32-M14', feedsInto: 'QF-M4', feedsSlot: 'A' },
  { id: 'R16-M8', round: 'R16', slotA: 'Winner R32-M15', slotB: 'Winner R32-M16', feedsInto: 'QF-M4', feedsSlot: 'B' },
  // Quarter-finals
  { id: 'QF-M1', round: 'QF', slotA: 'Winner R16-M1', slotB: 'Winner R16-M2', feedsInto: 'SF-M1', feedsSlot: 'A' },
  { id: 'QF-M2', round: 'QF', slotA: 'Winner R16-M3', slotB: 'Winner R16-M4', feedsInto: 'SF-M1', feedsSlot: 'B' },
  { id: 'QF-M3', round: 'QF', slotA: 'Winner R16-M5', slotB: 'Winner R16-M6', feedsInto: 'SF-M2', feedsSlot: 'A' },
  { id: 'QF-M4', round: 'QF', slotA: 'Winner R16-M7', slotB: 'Winner R16-M8', feedsInto: 'SF-M2', feedsSlot: 'B' },
  // Semi-finals
  { id: 'SF-M1', round: 'SF', slotA: 'Winner QF-M1', slotB: 'Winner QF-M2', feedsInto: 'FINAL', feedsSlot: 'A' },
  { id: 'SF-M2', round: 'SF', slotA: 'Winner QF-M3', slotB: 'Winner QF-M4', feedsInto: 'FINAL', feedsSlot: 'B' },
  // 3rd place & Final
  { id: '3RD',   round: '3RD',   slotA: 'Loser SF-M1', slotB: 'Loser SF-M2' },
  { id: 'FINAL', round: 'FINAL', slotA: 'Winner SF-M1', slotB: 'Winner SF-M2' },
]

export const MATCH_IDS = KNOCKOUT_MATCHES.map(m => m.id)
