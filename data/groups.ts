// Array order does NOT imply seeding — players rank teams themselves.
export const GROUPS: Record<string, string[]> = {
  A: ['MEX', 'JAM', 'HON', 'VEN'],
  B: ['USA', 'CAN', 'PAN', 'CUB'],
  C: ['BRA', 'COL', 'PAR', 'BOL'],
  D: ['ARG', 'CHI', 'PER', 'ECU'],
  E: ['ESP', 'MAR', 'BEL', 'NZL'],
  F: ['GER', 'JPN', 'CMR', 'KSA'],
  G: ['FRA', 'SEN', 'URU', 'UKR'],
  H: ['POR', 'POL', 'ALG', 'NGA'],
  I: ['ENG', 'SRB', 'IRI', 'CRC'],
  J: ['NED', 'AUS', 'RSA', 'CGO'],
  K: ['ITA', 'CRO', 'EGY', 'MEX2'],  // verify
  L: ['POR2', 'TBD2', 'TBD3', 'TBD4'], // verify
}

export const GROUP_CODES = Object.keys(GROUPS) as string[]
