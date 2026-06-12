export interface Team {
  code: string
  name: string
  flag: string
}

export const TEAMS: Record<string, Team> = {
  // Group A
  CZE: { code: 'CZE', name: 'Czech Republic', flag: '🇨🇿' },
  MEX: { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  RSA: { code: 'RSA', name: 'South Africa', flag: '🇿🇦' },
  KOR: { code: 'KOR', name: 'South Korea', flag: '🇰🇷' },
  // Group B
  BIH: { code: 'BIH', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  CAN: { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  QAT: { code: 'QAT', name: 'Qatar', flag: '🇶🇦' },
  SUI: { code: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  // Group C
  BRA: { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  HAI: { code: 'HAI', name: 'Haiti', flag: '🇭🇹' },
  MAR: { code: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  SCO: { code: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  // Group D
  AUS: { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  PAR: { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  TUR: { code: 'TUR', name: 'Türkiye', flag: '🇹🇷' },
  USA: { code: 'USA', name: 'USA', flag: '🇺🇸' },
  // Group E
  CIV: { code: 'CIV', name: "Côte d'Ivoire", flag: '🇨🇮' },
  CUW: { code: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  ECU: { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  GER: { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  // Group F
  JPN: { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  NED: { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  SWE: { code: 'SWE', name: 'Sweden', flag: '🇸🇪' },
  TUN: { code: 'TUN', name: 'Tunisia', flag: '🇹🇳' },
  // Group G
  BEL: { code: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  EGY: { code: 'EGY', name: 'Egypt', flag: '🇪🇬' },
  IRN: { code: 'IRN', name: 'Iran', flag: '🇮🇷' },
  NZL: { code: 'NZL', name: 'New Zealand', flag: '🇳🇿' },
  // Group H
  CPV: { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻' },
  ESP: { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  KSA: { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦' },
  URU: { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  // Group I
  FRA: { code: 'FRA', name: 'France', flag: '🇫🇷' },
  IRQ: { code: 'IRQ', name: 'Iraq', flag: '🇮🇶' },
  NOR: { code: 'NOR', name: 'Norway', flag: '🇳🇴' },
  SEN: { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  // Group J
  ALG: { code: 'ALG', name: 'Algeria', flag: '🇩🇿' },
  ARG: { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  AUT: { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  JOR: { code: 'JOR', name: 'Jordan', flag: '🇯🇴' },
  // Group K
  COD: { code: 'COD', name: 'DR Congo', flag: '🇨🇩' },
  COL: { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  POR: { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  UZB: { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿' },
  // Group L
  CRO: { code: 'CRO', name: 'Croatia', flag: '🇭🇷' },
  ENG: { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  GHA: { code: 'GHA', name: 'Ghana', flag: '🇬🇭' },
  PAN: { code: 'PAN', name: 'Panama', flag: '🇵🇦' },
}
