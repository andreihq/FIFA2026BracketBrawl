# ESPN Results Sync — Design Spec

**Date:** 2026-06-28
**Stack:** Next.js 14 (App Router) + Supabase + Vercel
**Status:** Approved design, pending implementation plan

---

## 1. Overview

Replace manual entry of actual World Cup results with a one-click pull from ESPN's
public (undocumented) API. The admin clicks **Sync from ESPN** on the admin Results
page; the app fetches live standings + knockout results, maps them onto this app's
data model, and **loads them into the existing editor for review**. Nothing is
persisted by the sync — the admin reviews both tabs and clicks the existing **Save
Group Results / Save Knockout Results** buttons to commit.

This keeps the manual override intact (important: ESPN is undocumented, no SLA) while
eliminating the tedious hand-entry of 48 group placements and ~31 knockout winners.

---

## 2. Scope

**In scope**
- New read-only endpoint `GET /api/admin/sync-espn` (admin-auth, returns mapped data).
- New shared library `lib/espn.ts` (fetch + pure mappers, unit-tested).
- New **Sync from ESPN** button on `app/admin/page.tsx` that fills editor state.
- Unit tests for the mappers against captured ESPN fixtures.
- Removal of the now-redundant `scripts/espn-spike.ts`.

**Out of scope**
- Writing to the database from the sync (review-then-save only).
- Automatic/cron syncing.
- Any change to scoring, the `actual_results` schema, or the save endpoint.

---

## 3. Data source (ESPN)

League slug `fifa.world`, season 2026. No key/auth.

| Data | Endpoint | Notes |
|---|---|---|
| Group standings | `GET https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026` | `children[]` = 12 groups; each `standings.entries[]` has `team.abbreviation` + `stats[]`. **Use the `apis/v2` path** — `apis/site/v2/...standings` returns `{}`. |
| Knockout matches | `GET https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260628-20260720&limit=200` | `events[]`; each has `season.slug` (round), two `competitors` (`team.abbreviation`, `winner` bool), `status.type.name`. Default scoreboard returns only today — must use a `dates=` range. |

**Verified facts (live, 2026-06-28):**
- All 64 ESPN `team.abbreviation` values are identical to this app's `data/teams.ts` codes — no mapping table needed.
- Standings `entries[]` are **not** returned in standings order, but each entry's `rank` stat is the correct live position (points + standard tiebreakers already applied). We sort by `rank`.
- Round slugs (confirmed against the live API): `round-of-32`, `round-of-16`, `quarterfinals`, `semifinals`, `3rd-place-match`, `final`. Later-round events use placeholder abbreviations (`RD32`, `QFW1`, `SF L1`…) until populated, so only R32 carries real team codes pre-knockout.

---

## 4. Target data model (unchanged)

The sync produces the three structures the admin editor already uses, which map to
existing `actual_results` rows via the existing `POST /api/admin/results`:

| Editor state | actual_results row | Sync produces |
|---|---|---|
| `groupRankings: Record<group, string[]>` | `result_type='group'`, `ref_id`=group letter, `position`=1..4 | teams per group ordered by ESPN `rank` |
| `advancingThirds: Set<group letter>` | `result_type='knockout'`, `ref_id`=`WILDCARD_1..8`, `team_code`=group letter | the 8 advancing third-place groups |
| `winners: Record<matchId, team>` | `result_type='knockout'`, `ref_id`=matchId (M73–M104), `team_code`=winner | winners of FINAL knockout matches only |

---

## 5. Components

### 5.1 `lib/espn.ts`

Three layers — HTTP isolated from pure mapping so the mappers are unit-testable.

```ts
export interface EspnSyncResult {
  groupRankings: Record<string, string[]>   // group letter -> team codes by ESPN rank
  advancingThirds: string[]                  // group letters of the 8 best thirds ([] until R32 published)
  winners: Record<string, string>            // app matchId -> winner code (FINAL matches only)
  meta: {
    groupStageComplete: boolean              // all 12 groups have all 3 games played
    groupsWithData: number                   // groups that returned entries
    knockoutFinalCount: number               // FINAL knockout matches successfully mapped
    unmapped: string[]                       // FINAL ESPN events that could not be mapped (e.g. "BRA vs JPN (round-of-16)")
    fetchedAt: string                        // ISO timestamp
  }
}

// Pure: ESPN standings JSON -> ranked teams per group.
export function mapStandings(raw: unknown): {
  groupRankings: Record<string, string[]>
  groupStageComplete: boolean
  groupsWithData: number
}

// Pure: ESPN scoreboard JSON + group rankings -> wildcards, winners, unmapped.
// Derives advancingThirds from R32 participants, runs buildQualifiers (Annex C),
// then resolves the bracket round-by-round with buildPicks, feeding in FINAL
// winners as it goes, matching each event to an app match by team-pair.
export function mapKnockout(raw: unknown, groupRankings: Record<string, string[]>): {
  advancingThirds: string[]
  winners: Record<string, string>
  unmapped: string[]
}

// Wires the two HTTP fetches to the mappers. Throws EspnFetchError on
// network failure / non-OK / unparseable response.
export async function fetchEspnResults(): Promise<EspnSyncResult>
```

Reuses `buildPicks`, `buildQualifiers`, `KNOCKOUT_MATCHES` from `data/bracket.ts` —
no reimplementation of bracket/Annex C logic.

**Group ordering rule:** sort each group's entries by the `rank` stat ascending,
uniformly for in-progress and completed groups. (ESPN's `rank` already encodes
points + tiebreakers live, per §3.)

**Knockout mapping algorithm:**
1. Collect all team codes appearing in `round-of-32` events → `advancingThirds` =
   groups whose 3rd-ranked team is in that set.
2. `qualifiers = buildQualifiers(groupRankings, new Set(advancingThirds))`.
3. `winners = {}`. For each round in order (R32, R16, QF, SF, 3RD, FINAL):
   `picks = buildPicks(groupRankings, qualifiers, winners)`; for each ESPN event in
   that round whose `status` is FINAL, find the app match in that round whose resolved
   `{teamA, teamB}` equals the event's team pair → record the ESPN winner in `winners`.
   Events that are not FINAL are ignored; FINAL events with no slot match go to `unmapped`.

### 5.2 `app/api/admin/sync-espn/route.ts`

```ts
export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await fetchEspnResults()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'ESPN fetch failed' },
      { status: 502 },
    )
  }
}
```

Same auth pattern as `app/api/admin/results/route.ts`. Read-only: no Supabase access.

### 5.3 `app/admin/page.tsx`

Add a **Sync from ESPN** button to the Results action bar (visible on both the Groups
and Knockouts tabs — placed on the left of the action bar, secondary style). Handler:

```ts
async function syncFromEspn() {
  setSaving(true); setMsg('')
  const res = await fetch('/api/admin/sync-espn', { headers: { 'x-admin-password': password } })
  if (!res.ok) { setMsg('ESPN sync failed — enter results manually'); setSaving(false); return }
  const r = await res.json()
  setGroupRankings(r.groupRankings)
  setAdvancingThirds(new Set(r.advancingThirds))
  setWinners(r.winners)
  setMsg(
    `Synced from ESPN: ${r.meta.groupsWithData} groups, ${r.advancingThirds.length} wildcards, ` +
    `${r.meta.knockoutFinalCount} knockout winners. Review, then Save.` +
    (r.meta.unmapped.length ? ` Unmapped: ${r.meta.unmapped.join('; ')}.` : '')
  )
  setSaving(false)
}
```

It overwrites in-memory editor state only; the admin must click the existing Save
buttons to persist. The sync does **not** auto-save.

---

## 6. Data flow

```
[Sync from ESPN] click
  -> GET /api/admin/sync-espn  (x-admin-password)
  -> fetchEspnResults(): GET standings + GET scoreboard
  -> mapStandings + mapKnockout (reuse buildPicks/buildQualifiers)
  -> JSON { groupRankings, advancingThirds, winners, meta }
  -> client: setGroupRankings / setAdvancingThirds / setWinners
  -> admin reviews Groups + Knockouts tabs (may tweak)
  -> existing [Save Group Results] / [Save Knockout Results]
  -> POST /api/admin/results
```

---

## 7. Error & edge handling

- **Wrong password** → 401, message "ESPN sync failed — enter results manually".
- **ESPN unreachable / non-OK / unparseable** → 502; client shows the same fallback message. Editor state is left unchanged.
- **Group stage incomplete** → returns whatever groups have entries; `groupStageComplete=false`; `winners` typically empty. Message reflects real counts.
- **R32 not yet published** → fewer than 8 advancing thirds; `buildQualifiers` returns `{}` (it requires exactly 8), so wildcard slots stay unresolved. No knockout matches are FINAL yet, so this is harmless.
- **Unmappable FINAL knockout event** (team pair matches no resolved slot — e.g. data lag, or unknown 3rd-place slug) → added to `meta.unmapped` and surfaced in the message; never guessed.
- **3rd-place slug uncertainty** → if the slug isn't recognized, those events fall through to `unmapped` rather than crashing; the admin enters that one result by hand if needed.
- **Code drift** (ESPN introduces a code not in `TEAMS`) → such a team simply won't match any slot and surfaces via `unmapped` / missing group data; covered by the fixture test asserting all codes ∈ `TEAMS`.

---

## 8. Testing

Network-free unit tests using captured ESPN responses in `__tests__/fixtures/`
(`espn-standings.json`, `espn-scoreboard.json`):

- `mapStandings`: 12 groups, each ordered by `rank`; `groupStageComplete` true for the
  complete-stage fixture.
- `mapKnockout`: `advancingThirds` equals the expected 8 groups; Annex C wildcard
  placement matches; for a fixture with FINAL R32 matches, all winners map to the
  correct `M73–M88` ids; `unmapped` empty.
- Guard: every `team.abbreviation` in both fixtures exists in `TEAMS`.

(Optional, manual) live smoke: hit `/api/admin/sync-espn` against the real API.

---

## 9. Files

| File | Change |
|---|---|
| `lib/espn.ts` | **new** — fetch + pure mappers |
| `app/api/admin/sync-espn/route.ts` | **new** — auth'd read-only endpoint |
| `app/admin/page.tsx` | edit — add **Sync from ESPN** button + handler |
| `__tests__/fixtures/espn-standings.json` | **new** — captured response |
| `__tests__/fixtures/espn-scoreboard.json` | **new** — captured response |
| `__tests__/espn.test.ts` | **new** — mapper unit tests |
| `scripts/espn-spike.ts` | **remove** — superseded by `lib/espn.ts` |
```
