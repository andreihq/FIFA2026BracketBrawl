// Pulls live FIFA 2026 World Cup data from ESPN's public API and maps it onto
// this app's data model. Pure mappers are separated from HTTP for testing.

import { buildPicks, buildQualifiers, KNOCKOUT_MATCHES } from '@/data/bracket'

// Minimal shapes for the parts of ESPN's JSON we actually read. Everything is
// optional because the payload is third-party and defensively accessed.
interface EspnStat { name?: string; value?: number }
interface EspnTeam { abbreviation?: string }
interface EspnEntry { team?: EspnTeam; stats?: EspnStat[] }
interface EspnGroup { name?: string; standings?: { entries?: EspnEntry[] } }
interface EspnStandings { children?: EspnGroup[] }

interface EspnCompetitor { winner?: boolean; team?: EspnTeam }
interface EspnCompetition { competitors?: EspnCompetitor[] }
interface EspnScoreEvent {
  season?: { slug?: string }
  competitions?: EspnCompetition[]
  status?: { type?: { name?: string; completed?: boolean } }
}
interface EspnScoreboard { events?: EspnScoreEvent[] }

function statVal(stats: EspnStat[] | undefined, name: string): number {
  const s = stats?.find((x) => x?.name === name)
  return typeof s?.value === 'number' ? s.value : 0
}

export function mapStandings(rawInput: unknown): {
  groupRankings: Record<string, string[]>
  groupStageComplete: boolean
  groupsWithData: number
} {
  const raw = rawInput as EspnStandings
  const groupRankings: Record<string, string[]> = {}
  let groupsWithData = 0
  let groupStageComplete = true

  for (const group of raw?.children ?? []) {
    const letter = String(group?.name ?? '').replace('Group ', '').trim()
    const entries = [...(group?.standings?.entries ?? [])]
    if (entries.length === 0) continue
    groupsWithData++
    entries.sort((a, b) => statVal(a.stats, 'rank') - statVal(b.stats, 'rank'))
    groupRankings[letter] = entries
      .map((e) => e.team?.abbreviation as string)
      .filter(Boolean)
    for (const e of entries) {
      if (statVal(e.stats, 'gamesPlayed') < 3) groupStageComplete = false
    }
  }
  if (groupsWithData < 12) groupStageComplete = false

  return { groupRankings, groupStageComplete, groupsWithData }
}

const ROUND_FROM_SLUG: Record<string, string> = {
  'round-of-32': 'R32',
  'round-of-16': 'R16',
  quarterfinals: 'QF',
  semifinals: 'SF',
  '3rd-place-match': '3RD',
  final: 'FINAL',
}
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']

interface KoEvent {
  round: string
  teams: [string, string]
  winner: string | null
  final: boolean
  label: string
}

function parseEvents(rawInput: unknown): KoEvent[] {
  const raw = rawInput as EspnScoreboard
  const out: KoEvent[] = []
  for (const ev of raw?.events ?? []) {
    const slug = ev?.season?.slug ?? ''
    const round = ROUND_FROM_SLUG[slug]
    if (!round) continue
    const comps = ev?.competitions?.[0]?.competitors ?? []
    if (comps.length !== 2) continue
    const teamA = comps[0]?.team?.abbreviation
    const teamB = comps[1]?.team?.abbreviation
    if (!teamA || !teamB) continue
    const teams: [string, string] = [teamA, teamB]
    const winner = comps.find((c) => c?.winner)?.team?.abbreviation ?? null
    // ESPN soccer marks finished matches with completed:true (STATUS_FULL_TIME,
    // STATUS_FINAL_AET, penalty finishes, …) — not the STATUS_FINAL name used by
    // US sports. Trust the canonical boolean so every knockout result is caught.
    const final = ev?.status?.type?.completed === true
    out.push({ round, teams, winner, final, label: `${teams[0]} vs ${teams[1]} (${slug})` })
  }
  return out
}

function samePair(a: [string, string], b: [string, string]): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])
}

export function mapKnockout(
  raw: unknown,
  groupRankings: Record<string, string[]>,
): { advancingThirds: string[]; winners: Record<string, string>; unmapped: string[] } {
  const events = parseEvents(raw)

  // The 8 advancing thirds are whichever groups' 3rd-ranked team shows up in R32.
  const r32Teams = new Set(
    events.filter((e) => e.round === 'R32').flatMap((e) => e.teams),
  )
  const advancingThirds = Object.entries(groupRankings)
    .filter(([, ranked]) => ranked[2] && r32Teams.has(ranked[2]))
    .map(([g]) => g)
    .sort()

  const qualifiers = buildQualifiers(groupRankings, new Set(advancingThirds))
  const winners: Record<string, string> = {}
  const unmapped: string[] = []

  // Resolve the bracket round-by-round, feeding FINAL winners forward so later
  // rounds resolve their team slots before we try to match them.
  for (const round of ROUND_ORDER) {
    const roundEvents = events.filter((e) => e.round === round && e.final)
    if (roundEvents.length === 0) continue
    const picks = buildPicks(groupRankings, qualifiers, winners)
    const appMatches = KNOCKOUT_MATCHES.filter((m) => m.round === round)
    for (const ev of roundEvents) {
      const match = appMatches.find((m) => {
        const p = picks[m.id]
        return p?.teamA && p?.teamB && samePair([p.teamA, p.teamB], ev.teams)
      })
      if (match) {
        // STATUS_FINAL with a found slot but no winner is an ESPN data anomaly;
        // skip it silently rather than reporting a spurious unmapped warning.
        if (ev.winner) winners[match.id] = ev.winner
      } else {
        unmapped.push(ev.label)
      }
    }
  }

  return { advancingThirds, winners, unmapped }
}

const STANDINGS_URL =
  'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026'
const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260628-20260720&limit=300'

export interface EspnSyncResult {
  groupRankings: Record<string, string[]>
  advancingThirds: string[]
  winners: Record<string, string>
  meta: {
    groupStageComplete: boolean
    groupsWithData: number
    knockoutFinalCount: number
    unmapped: string[]
    fetchedAt: string
  }
}

export class EspnFetchError extends Error {}

async function getJson(url: string): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'fifa-bracket-sync' },
      cache: 'no-store',
    })
  } catch (err) {
    throw new EspnFetchError(`Network error fetching ESPN: ${(err as Error).message}`)
  }
  if (!res.ok) throw new EspnFetchError(`ESPN responded ${res.status} ${res.statusText}`)
  try {
    return await res.json()
  } catch {
    throw new EspnFetchError('ESPN returned an unparseable response')
  }
}

export async function fetchEspnResults(): Promise<EspnSyncResult> {
  const [standingsRaw, scoreboardRaw] = await Promise.all([
    getJson(STANDINGS_URL),
    getJson(SCOREBOARD_URL),
  ])
  const { groupRankings, groupStageComplete, groupsWithData } = mapStandings(standingsRaw)
  const { advancingThirds, winners, unmapped } = mapKnockout(scoreboardRaw, groupRankings)
  return {
    groupRankings,
    advancingThirds,
    winners,
    meta: {
      groupStageComplete,
      groupsWithData,
      knockoutFinalCount: Object.keys(winners).length,
      unmapped,
      fetchedAt: new Date().toISOString(),
    },
  }
}
