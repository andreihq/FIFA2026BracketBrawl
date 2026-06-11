// Verify all entries against the official FIFA 2026 draw before deploying.
export interface Team {
  code: string   // 3-letter FIFA code
  name: string
  flag: string   // emoji
}

export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  JAM: { code: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  HON: { code: 'HON', name: 'Honduras', flag: '🇭🇳' },
  VEN: { code: 'VEN', name: 'Venezuela', flag: '🇻🇪' },
  // Group B
  USA: { code: 'USA', name: 'USA', flag: '🇺🇸' },
  CAN: { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  PAN: { code: 'PAN', name: 'Panama', flag: '🇵🇦' },
  CUB: { code: 'CUB', name: 'Cuba', flag: '🇨🇺' },
  // Group C
  BRA: { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  COL: { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  PAR: { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  BOL: { code: 'BOL', name: 'Bolivia', flag: '🇧🇴' },
  // Group D
  ARG: { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  CHI: { code: 'CHI', name: 'Chile', flag: '🇨🇱' },
  PER: { code: 'PER', name: 'Peru', flag: '🇵🇪' },
  ECU: { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  // Group E
  ESP: { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  MAR: { code: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  BEL: { code: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  NZL: { code: 'NZL', name: 'New Zealand', flag: '🇳🇿' },
  // Group F
  GER: { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  JPN: { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  CMR: { code: 'CMR', name: 'Cameroon', flag: '🇨🇲' },
  KSA: { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦' },
  // Group G
  FRA: { code: 'FRA', name: 'France', flag: '🇫🇷' },
  SEN: { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  URU: { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  UKR: { code: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
  // Group H
  POR: { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  POL: { code: 'POL', name: 'Poland', flag: '🇵🇱' },
  ALG: { code: 'ALG', name: 'Algeria', flag: '🇩🇿' },
  NGA: { code: 'NGA', name: 'Nigeria', flag: '🇳🇬' },
  // Group I
  ENG: { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  SRB: { code: 'SRB', name: 'Serbia', flag: '🇷🇸' },
  IRI: { code: 'IRI', name: 'Iran', flag: '🇮🇷' },
  CRC: { code: 'CRC', name: 'Costa Rica', flag: '🇨🇷' },
  // Group J
  NED: { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  AUS: { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  RSA: { code: 'RSA', name: 'South Africa', flag: '🇿🇦' },
  CGO: { code: 'CGO', name: 'DR Congo', flag: '🇨🇩' },
  // Group K
  ITA: { code: 'ITA', name: 'Italy', flag: '🇮🇹' },
  CRO: { code: 'CRO', name: 'Croatia', flag: '🇭🇷' },
  EGY: { code: 'EGY', name: 'Egypt', flag: '🇪🇬' },
  MEX2: { code: 'MEX2', name: 'TBD', flag: '🏳️' }, // placeholder — verify draw
  // Group L
  POR2: { code: 'POR2', name: 'TBD', flag: '🏳️' }, // placeholder — verify draw
  TBD2: { code: 'TBD2', name: 'TBD', flag: '🏳️' },
  TBD3: { code: 'TBD3', name: 'TBD', flag: '🏳️' },
  TBD4: { code: 'TBD4', name: 'TBD', flag: '🏳️' },
}
