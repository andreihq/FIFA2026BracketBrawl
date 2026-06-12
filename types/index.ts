export interface Player {
  id: string
  username: string
  created_at: string
}

export interface League {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface LeagueMember {
  league_id: string
  player_id: string
  joined_at: string
}

export interface Bracket {
  id: string
  player_id: string
  submitted_at: string | null
  locked: boolean
}

export interface GroupPrediction {
  id: string
  bracket_id: string
  group_code: string   // "A"–"L"
  team_code: string
  predicted_pos: number // 1, 2, or 3
}

export interface KnockoutPrediction {
  id: string
  bracket_id: string
  match_id: string     // "R32-M1" … "R16-M1" … "QF-M1" … "SF-M1" … "3RD" … "FINAL"
  predicted_winner: string
}

export interface ActualResult {
  id: string
  result_type: 'group' | 'knockout'
  ref_id: string       // group_code ("A") or match_id ("R32-M1")
  team_code: string
  position: number | null  // 1/2/3 for group; null for knockout
  entered_at: string
}

export interface SessionData {
  playerId: string
  username: string
}
