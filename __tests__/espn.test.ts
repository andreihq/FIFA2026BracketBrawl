import standings from './fixtures/espn-standings.json'
import scoreboard from './fixtures/espn-scoreboard.json'
import { mapStandings, mapKnockout } from '@/lib/espn'
import { TEAMS } from '@/data/teams'

describe('mapStandings', () => {
  const result = mapStandings(standings)

  it('returns all 12 groups', () => {
    expect(Object.keys(result.groupRankings).sort()).toEqual(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    )
    expect(result.groupsWithData).toBe(12)
  })

  it('orders each group by ESPN rank', () => {
    expect(result.groupRankings['A']).toEqual(['MEX', 'RSA', 'KOR', 'CZE'])
    expect(result.groupRankings['A']).toHaveLength(4)
  })

  it('reports group stage complete for a finished fixture', () => {
    expect(result.groupStageComplete).toBe(true)
  })

  it('every standings code exists in TEAMS (drift guard)', () => {
    for (const codes of Object.values(result.groupRankings)) {
      for (const c of codes) expect(TEAMS[c]).toBeDefined()
    }
  })
})

describe('mapKnockout', () => {
  const { groupRankings } = mapStandings(standings)

  it('derives the 8 advancing third-place groups from R32 participants', () => {
    const { advancingThirds } = mapKnockout(scoreboard, groupRankings)
    expect(advancingThirds).toEqual(['B', 'D', 'E', 'F', 'I', 'J', 'K', 'L'])
  })

  it('does not record winners while matches are unplayed, and reports none unmapped', () => {
    const { winners, unmapped } = mapKnockout(scoreboard, groupRankings)
    expect(unmapped).toEqual([])
    // Captured fixture has no FINAL knockout matches yet.
    expect(Object.keys(winners)).toHaveLength(0)
  })

  it('every Round-of-32 team code exists in TEAMS (drift guard)', () => {
    // Only R32 events carry real team codes; later rounds use placeholder
    // abbreviations (RD32, QFW1, SF L1…) until those matches are populated.
    for (const ev of (scoreboard as { events?: any[] }).events ?? []) {
      if (ev?.season?.slug !== 'round-of-32') continue
      for (const comp of ev?.competitions?.[0]?.competitors ?? []) {
        const code = comp?.team?.abbreviation
        if (code) expect(TEAMS[code]).toBeDefined()
      }
    }
  })

  it('maps a FINAL match to the correct app match id by team-pair', () => {
    // Simulate ESPN marking the GER vs PAR R32 match final, GER winning.
    const sim = JSON.parse(JSON.stringify(scoreboard))
    for (const ev of sim.events) {
      const comps = ev.competitions?.[0]?.competitors ?? []
      const abbrs = comps.map((c: any) => c.team?.abbreviation)
      if (abbrs.includes('GER') && abbrs.includes('PAR')) {
        ev.status.type.name = 'STATUS_FULL_TIME'
        ev.status.type.completed = true
        for (const c of comps) c.winner = c.team.abbreviation === 'GER'
      }
    }
    const { winners, unmapped } = mapKnockout(sim, groupRankings)
    expect(winners['M74']).toBe('GER') // 1E (GER) vs W (PAR, group D 3rd via Annex C)
    expect(unmapped).toEqual([])
  })

  it('treats a real soccer finish (STATUS_FULL_TIME, completed) as final', () => {
    // ESPN soccer marks finished matches STATUS_FULL_TIME with completed:true —
    // NOT STATUS_FINAL. Mirror the real RSA vs CAN R32 result (Canada won).
    const sim = JSON.parse(JSON.stringify(scoreboard))
    for (const ev of sim.events) {
      const comps = ev.competitions?.[0]?.competitors ?? []
      const abbrs = comps.map((c: any) => c.team?.abbreviation)
      if (abbrs.includes('RSA') && abbrs.includes('CAN')) {
        ev.status.type.name = 'STATUS_FULL_TIME'
        ev.status.type.completed = true
        for (const c of comps) c.winner = c.team.abbreviation === 'CAN'
      }
    }
    const { winners, unmapped } = mapKnockout(sim, groupRankings)
    expect(winners['M73']).toBe('CAN') // 2A (RSA) vs 2B (CAN)
    expect(unmapped).toEqual([])
  })
})
