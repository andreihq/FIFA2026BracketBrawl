# Best 3rd Place Checkboxes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-slot "Best 3rd" qualifier dropdowns in the Knockout tab with per-group checkboxes in the Group Stage tab, auto-assigning advancing 3rd-place teams to R32 slots deterministically.

**Architecture:** `advancingThirds: Set<string>` (max 8 group codes) replaces `qualifiers: Record<matchId, teamCode>` as the source of truth. A new `buildQualifiers` function derives match→team assignments from the set + group rankings (matches sorted by numeric ID, groups assigned alphabetically). GroupStageEditor gains a checkbox below each group card. KnockoutBracket removes qualifier dropdowns — Best 3rd teamB slots are now static auto-populated rows. Persistence switches from `MXX:qualifier` records to `WILDCARD_N | groupCode` records. A one-time migration script converts existing data.

**Tech Stack:** Next.js 14 App Router, TypeScript, React, Supabase, Jest/ts-jest

---

## File Map

| File | Change |
|------|--------|
| `data/bracket.ts` | Add `buildQualifiers` export |
| `__tests__/bracket.test.ts` | New — tests for `buildQualifiers` |
| `components/GroupStageEditor.tsx` | Add `advances`, `onAdvancesChange`, `canAdvance` optional props + checkbox UI |
| `components/KnockoutBracket.tsx` | Remove `QualifierDropdown`; simplify `onPick` to `(matchId, winner)` |
| `components/BracketEditor.tsx` | Replace `qualifiers` prop with `advancingThirds`; wire checkboxes; add validation banner |
| `components/BracketView.tsx` | Parse `WILDCARD_N` records; call `buildQualifiers`; pass `advances` to GroupStageEditor |
| `app/bracket/page.tsx` | Replace `qualifiers` state with `advancingThirds`; update load/save/validation |
| `app/admin/page.tsx` | Replace `qualifiers` state with `advancingThirds`; update save/reset/BracketEditor props |
| `scripts/migrate-qualifiers.ts` | New — one-time migration script; exports `migrateQualifiers` for testing |
| `__tests__/migrate-qualifiers.test.ts` | New — tests for `migrateQualifiers` using real DB bracket snapshots |

---

## Task 1: Add `buildQualifiers` to `data/bracket.ts`

**Files:**
- Modify: `data/bracket.ts`
- Create: `__tests__/bracket.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/bracket.test.ts`:

```typescript
import { buildQualifiers } from '@/data/bracket'

// Rankings mirrors the actual GROUPS data (index 2 = 3rd place)
const rankings: Record<string, string[]> = {
  A: ['CZE', 'MEX', 'RSA', 'KOR'],
  B: ['BIH', 'CAN', 'QAT', 'SUI'],
  C: ['BRA', 'HAI', 'MAR', 'SCO'],
  D: ['AUS', 'PAR', 'TUR', 'USA'],
  E: ['CIV', 'CUW', 'ECU', 'GER'],
  F: ['JPN', 'NED', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['CPV', 'ESP', 'KSA', 'URU'],
  I: ['FRA', 'IRQ', 'NOR', 'SEN'],
  J: ['ALG', 'ARG', 'AUT', 'JOR'],
  K: ['COD', 'COL', 'POR', 'UZB'],
  L: ['CRO', 'ENG', 'GHA', 'PAN'],
}

describe('buildQualifiers', () => {
  it('returns empty object when no groups selected', () => {
    expect(buildQualifiers(rankings, new Set())).toEqual({})
  })

  it('assigns group A 3rd-place to M74 (first eligible match for A)', () => {
    // M74 eligible groups: A B C D F — A is alphabetically first
    const result = buildQualifiers(rankings, new Set(['A']))
    expect(result['M74']).toBe('RSA') // rankings.A[2]
    expect(Object.keys(result)).toHaveLength(1)
  })

  it('assigns group B 3rd-place to M74 when A is not selected', () => {
    // M74 eligible: A B C D F — B is first selected
    const result = buildQualifiers(rankings, new Set(['B']))
    expect(result['M74']).toBe('QAT') // rankings.B[2]
  })

  it('with A and B both selected, A goes to M74 and B goes to M81', () => {
    // M74: A,B,C,D,F eligible → A wins (alphabetical)
    // M77: C,D,F,G,H eligible → B not eligible, no candidate
    // M79: C,E,F,H,I eligible → B not eligible
    // M80: E,H,I,J,K eligible → B not eligible
    // M81: B,E,F,I,J eligible → B wins
    const result = buildQualifiers(rankings, new Set(['A', 'B']))
    expect(result['M74']).toBe('RSA')  // A → M74
    expect(result['M81']).toBe('QAT') // B → M81
    expect(Object.keys(result)).toHaveLength(2)
  })

  it('never assigns the same group twice', () => {
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']))
    const teamValues = Object.values(result)
    const uniqueTeams = new Set(teamValues)
    expect(teamValues.length).toBe(uniqueTeams.size)
  })

  it('fills all 8 slots when 8 groups with full coverage are selected', () => {
    // A,B,C,D,E,F,G,H covers all 8 match eligible sets
    const result = buildQualifiers(rankings, new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']))
    expect(Object.keys(result)).toHaveLength(8)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx jest __tests__/bracket.test.ts --no-coverage
```

Expected: FAIL — `buildQualifiers is not a function` (or similar import error)

- [ ] **Step 3: Add `buildQualifiers` to `data/bracket.ts`**

Append after the closing brace of `buildPicks`:

```typescript
// R32 "Best 3rd" match IDs in ascending numeric order (M74 < M77 < M79 …)
const BEST_3RD_MATCH_IDS: string[] = KNOCKOUT_MATCHES
  .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd'))
  .sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)))
  .map(m => m.id)

// Derives matchId→teamCode qualifier map from the set of advancing group codes.
// Processes matches in numeric order; for each match, picks the alphabetically
// first selected group that is eligible and not yet used.
export function buildQualifiers(
  groupRankings: Record<string, string[]>,
  advancingThirds: Set<string>,
): Record<string, string> {
  const result: Record<string, string> = {}
  const used = new Set<string>()

  for (const matchId of BEST_3RD_MATCH_IDS) {
    const match = KNOCKOUT_MATCHES.find(m => m.id === matchId)!
    const eligibleGroups = match.slotB.replace('Best 3rd ', '').split('')
    const candidates = eligibleGroups
      .filter(g => advancingThirds.has(g) && !used.has(g))
      .sort()

    if (candidates.length > 0) {
      const group = candidates[0]
      const team = groupRankings[group]?.[2]
      if (team) {
        result[matchId] = team
        used.add(group)
      }
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx jest __tests__/bracket.test.ts --no-coverage
```

Expected: PASS — 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add data/bracket.ts __tests__/bracket.test.ts
git commit -m "feat: add buildQualifiers — auto-assign advancing 3rd-place groups to R32 slots"
```

---

## Task 2: Add 3rd-place checkbox to `GroupStageEditor`

**Files:**
- Modify: `components/GroupStageEditor.tsx`

These are additive optional props — no callers break until later tasks wire them in.

- [ ] **Step 1: Add new optional props to the `Props` interface**

In `components/GroupStageEditor.tsx`, replace the `Props` interface:

```tsx
interface Props {
  groupCode: string
  order: string[]
  onChange: (groupCode: string, newOrder: string[]) => void
  disabled?: boolean
  correctPositions?: Set<number>
  advances?: boolean
  onAdvancesChange?: (groupCode: string, val: boolean) => void
  canAdvance?: boolean
}
```

- [ ] **Step 2: Destructure new props in the function signature**

Replace:
```tsx
export function GroupStageEditor({ groupCode, order, onChange, disabled = false, correctPositions }: Props) {
```
With:
```tsx
export function GroupStageEditor({ groupCode, order, onChange, disabled = false, correctPositions, advances, onAdvancesChange, canAdvance = true }: Props) {
```

- [ ] **Step 3: Add checkbox after the SortableContext closing tag**

Inside the returned `<div className="card p-4">`, after `</DndContext>` and before the closing `</div>`, add:

```tsx
{advances !== undefined && (
  <div className="mt-3 pt-3 border-t border-pitch-700">
    <label className={`flex items-center gap-2.5 select-none ${disabled || (!advances && !canAdvance) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 transition-opacity'}`}>
      <input
        type="checkbox"
        checked={advances}
        disabled={disabled || (!advances && !canAdvance)}
        onChange={e => onAdvancesChange?.(groupCode, e.target.checked)}
        className="w-4 h-4 rounded border-pitch-500 bg-pitch-800 accent-[#CD7F32] cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="text-xs">
        {teams[2] ? (
          <>
            <span className="mr-1">{TEAMS[teams[2]]?.flag ?? '🏳️'}</span>
            <span className="font-medium text-[#EBF0FF]">{TEAMS[teams[2]]?.name ?? teams[2]}</span>
            <span className="ml-1 text-pitch-400">advances</span>
          </>
        ) : (
          <span className="italic text-pitch-400">3rd place TBD</span>
        )}
      </span>
    </label>
  </div>
)}
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx tsc --noEmit
```

Expected: no new errors (new props are optional)

- [ ] **Step 5: Commit**

```bash
git add components/GroupStageEditor.tsx
git commit -m "feat: add 3rd-place advancement checkbox to GroupStageEditor"
```

---

## Task 3: Simplify `KnockoutBracket` — remove `QualifierDropdown`

**Files:**
- Modify: `components/KnockoutBracket.tsx`

**Note:** This task changes the `onPick` type signature. `BracketEditor` and `BracketView` will have transient TypeScript errors until Task 4 and Task 5 fix them.

- [ ] **Step 1: Update the `Props` interface**

In `components/KnockoutBracket.tsx`, replace the `Props` interface:

```tsx
interface Props {
  picks: Record<string, MatchPick>
  onPick: (matchId: string, winner: string) => void
  disabled?: boolean
  showValidation?: boolean
  submitAttempt?: number
  correctPicks?: Record<string, MatchPick>
}
```

(`groupRankings` removed — no longer needed after QualifierDropdown is gone.)

- [ ] **Step 2: Delete the `QualifierDropdown` function**

Remove the entire `QualifierDropdown` function (currently lines 97–129 in the original file).

- [ ] **Step 3: Update `WinnerDropdown` call signature**

In `WinnerDropdown`, change:
```tsx
onChange={code => onPick(srcMatchId, 'winner', code)}
```
To:
```tsx
onChange={code => onPick(srcMatchId, code)}
```

- [ ] **Step 4: Update `ChampionsPodium` call signatures**

In `ChampionsPodium`, change:
```tsx
onChange={code => onPick('M104', 'winner', code)}
```
To:
```tsx
onChange={code => onPick('M104', code)}
```

And:
```tsx
onChange={code => onPick('M103', 'winner', code)}
```
To:
```tsx
onChange={code => onPick('M103', code)}
```

- [ ] **Step 5: Remove `groupRankings` from `MatchCard` props and body**

Replace the `MatchCard` props interface:

```tsx
function MatchCard({ match, picks, onPick, disabled, label, showValidation, correctPicks, dividerRef }: {
  match: KnockoutMatch
  picks: Record<string, MatchPick>
  onPick: (matchId: string, winner: string) => void
  disabled: boolean
  label?: string
  showValidation: boolean
  correctPicks?: Record<string, MatchPick>
  dividerRef?: React.RefCallback<HTMLDivElement>
})
```

- [ ] **Step 6: Simplify the teamB rendering block in `MatchCard`**

Replace the entire teamB rendering block (the `disabled ? ... : isR32 && isBest3rdB ? ... : isR32 || !srcB ? ... : ...` chain) with:

```tsx
{disabled ? (
  <TeamRow
    teamCode={mp.teamB}
    label={slotBLabel}
    correct={(!isR32 || isBest3rdB) && !!mp.teamB && mp.teamB === cp?.teamB}
  />
) : isR32 || !srcB ? (
  <TeamRow teamCode={mp.teamB} label={slotBLabel} />
) : (
  <WinnerDropdown srcMatchId={srcB} picks={picks} onPick={onPick} showValidation={showValidation} />
)}
```

- [ ] **Step 7: Remove `groupRankings` from `KnockoutBracket` function and all `MatchCard` call sites**

In the `KnockoutBracket` function signature, remove `groupRankings` from destructured props.

At each `<MatchCard ... />` call site in the render, remove the `groupRankings={groupRankings}` prop.

- [ ] **Step 8: Simplify `allPicksMade` — remove the teamB check**

Replace:
```tsx
const allPicksMade = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
  && KNOCKOUT_MATCHES
    .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd'))
    .every(m => !!picks[m.id]?.teamB)
```
With:
```tsx
const allPicksMade = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
```

- [ ] **Step 9: Commit (TypeScript errors on BracketEditor/BracketView are expected — fixed in later tasks)**

```bash
git add components/KnockoutBracket.tsx
git commit -m "feat: remove QualifierDropdown from KnockoutBracket, Best 3rd teamB now auto-populated"
```

---

## Task 4: Update `BracketEditor` — wire `advancingThirds`

**Files:**
- Modify: `components/BracketEditor.tsx`

This fixes the TypeScript errors introduced by Task 3 for `BracketEditor`'s use of `KnockoutBracket`, and introduces the new `advancingThirds` prop that `bracket/page.tsx` will supply in Task 6.

- [ ] **Step 1: Replace `BracketEditor.tsx` entirely**

```tsx
'use client'
import { useState } from 'react'
import { GROUP_CODES } from '@/data/groups'
import { buildPicks, buildQualifiers } from '@/data/bracket'
import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'

type Tab = 'groups' | 'knockouts'

interface Props {
  groupRankings: Record<string, string[]>
  advancingThirds: Set<string>
  winners: Record<string, string>
  onGroupChange: (groupCode: string, order: string[]) => void
  onAdvancingThirdsChange: (groupCode: string, val: boolean) => void
  onPick: (matchId: string, winner: string) => void
  disabled?: boolean
  showValidation?: boolean
  submitAttempt?: number
  tab?: Tab
  onTabChange?: (tab: Tab) => void
}

export function BracketEditor({
  groupRankings,
  advancingThirds,
  winners,
  onGroupChange,
  onAdvancingThirdsChange,
  onPick,
  disabled = false,
  showValidation = false,
  submitAttempt = 0,
  tab: controlledTab,
  onTabChange,
}: Props) {
  const [internalTab, setInternalTab] = useState<Tab>('groups')
  const tab = controlledTab ?? internalTab

  function switchTab(t: Tab) {
    setInternalTab(t)
    onTabChange?.(t)
  }

  const qualifiers = buildQualifiers(groupRankings, advancingThirds)
  const picks = buildPicks(groupRankings, qualifiers, winners)
  const thirdsComplete = advancingThirds.size === 8

  return (
    <>
      <div className="flex gap-1.5 mb-6">
        {(['groups', 'knockouts'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`tab-btn ${tab === t ? 'tab-active' : 'tab-inactive'}`}
          >
            {t === 'groups' ? 'Group Stage' : 'Knockouts'}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <>
          {showValidation && !thirdsComplete && (
            <div className="mb-4 rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm font-medium text-[#F87171]">
              Select exactly 8 third-place teams to advance — {advancingThirds.size}/8 selected.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {GROUP_CODES.map(g => (
              <GroupStageEditor
                key={g}
                groupCode={g}
                order={groupRankings[g] ?? []}
                onChange={onGroupChange}
                disabled={disabled}
                advances={advancingThirds.has(g)}
                onAdvancesChange={onAdvancingThirdsChange}
                canAdvance={advancingThirds.size < 8 || advancingThirds.has(g)}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'knockouts' && (
        <div className="-mx-5">
          <KnockoutBracket
            picks={picks}
            onPick={onPick}
            disabled={disabled}
            showValidation={showValidation}
            submitAttempt={submitAttempt}
          />
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript — BracketEditor errors should be gone**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx tsc --noEmit
```

Expected: errors remain only in `app/bracket/page.tsx` (old props) and `components/BracketView.tsx` (old KnockoutBracket props)

- [ ] **Step 3: Commit**

```bash
git add components/BracketEditor.tsx
git commit -m "feat: BracketEditor wires advancingThirds checkboxes, computes qualifiers internally"
```

---

## Task 5: Update `BracketView` for new data format

**Files:**
- Modify: `components/BracketView.tsx`

- [ ] **Step 1: Replace `BracketView.tsx` entirely**

```tsx
'use client'
import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'
import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'
import { GROUP_CODES } from '@/data/groups'
import { buildPicks, buildQualifiers } from '@/data/bracket'

interface Props {
  groupPredictions: GroupPrediction[]
  knockoutPredictions: KnockoutPrediction[]
  actualResults?: ActualResult[]
  tab: 'groups' | 'knockouts'
}

export function BracketView({ groupPredictions, knockoutPredictions, actualResults = [], tab }: Props) {
  const groupRankings: Record<string, string[]> = {}
  for (const g of GROUP_CODES) {
    groupRankings[g] = groupPredictions
      .filter(p => p.group_code === g)
      .sort((a, b) => a.predicted_pos - b.predicted_pos)
      .map(p => p.team_code)
  }

  // Parse WILDCARD_N records → set of advancing group codes
  const advancingThirds = new Set<string>()
  const winners: Record<string, string> = {}
  for (const p of knockoutPredictions) {
    if (p.match_id.startsWith('WILDCARD_')) advancingThirds.add(p.predicted_winner)
    else winners[p.match_id] = p.predicted_winner
  }

  const qualifiers = buildQualifiers(groupRankings, advancingThirds)
  const picks = buildPicks(groupRankings, qualifiers, winners)

  // correctPositions[groupCode] = set of 0-based indices where prediction matches actual
  const correctPositions: Record<string, Set<number>> = {}
  const actualGroupRankings: Record<string, string[]> = {}
  for (const r of actualResults) {
    if (r.result_type === 'group' && r.position !== null) {
      if (!actualGroupRankings[r.ref_id]) actualGroupRankings[r.ref_id] = []
      actualGroupRankings[r.ref_id][r.position - 1] = r.team_code

      const order = groupRankings[r.ref_id] ?? []
      const predictedIdx = order.indexOf(r.team_code)
      if (predictedIdx !== -1 && predictedIdx === r.position - 1) {
        if (!correctPositions[r.ref_id]) correctPositions[r.ref_id] = new Set()
        correctPositions[r.ref_id].add(predictedIdx)
      }
    }
  }

  const actualAdvancingThirds = new Set<string>()
  const actualWinners: Record<string, string> = {}
  for (const r of actualResults) {
    if (r.result_type === 'knockout') {
      if (r.ref_id.startsWith('WILDCARD_')) actualAdvancingThirds.add(r.team_code)
      else actualWinners[r.ref_id] = r.team_code
    }
  }
  const actualQualifiers = buildQualifiers(actualGroupRankings, actualAdvancingThirds)
  const correctPicks = buildPicks(actualGroupRankings, actualQualifiers, actualWinners, { skipQualifierValidation: true })

  if (tab === 'groups') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUP_CODES.map(g => (
          <GroupStageEditor
            key={g}
            groupCode={g}
            order={groupRankings[g] ?? []}
            onChange={() => {}}
            disabled
            correctPositions={correctPositions[g]}
            advances={advancingThirds.has(g)}
            onAdvancesChange={() => {}}
            canAdvance={false}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="-mx-5">
      <KnockoutBracket
        picks={picks}
        onPick={() => {}}
        disabled
        correctPicks={correctPicks}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — only `app/bracket/page.tsx` errors should remain**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx tsc --noEmit
```

Expected: only `app/bracket/page.tsx` errors about old `qualifiers` / `onPick` props

- [ ] **Step 3: Commit**

```bash
git add components/BracketView.tsx
git commit -m "feat: BracketView parses WILDCARD_N records, shows advancing 3rd checkboxes read-only"
```

---

## Task 6: Update `app/bracket/page.tsx`

**Files:**
- Modify: `app/bracket/page.tsx`

- [ ] **Step 1: Replace state + imports**

Replace:
```tsx
const [qualifiers, setQualifiers] = useState<Record<string, string>>({})
```
With:
```tsx
const [advancingThirds, setAdvancingThirds] = useState<Set<string>>(new Set())
```

Add `buildQualifiers` to the import from `@/data/bracket`:
```tsx
import { KNOCKOUT_MATCHES, buildPicks, buildQualifiers } from '@/data/bracket'
```

- [ ] **Step 2: Update the `picks` memo**

Replace:
```tsx
const picks = useMemo(
  () => buildPicks(groupRankings, qualifiers, winners),
  [groupRankings, qualifiers, winners]
)
```
With:
```tsx
const qualifiers = useMemo(
  () => buildQualifiers(groupRankings, advancingThirds),
  [groupRankings, advancingThirds]
)
const picks = useMemo(
  () => buildPicks(groupRankings, qualifiers, winners),
  [groupRankings, qualifiers, winners]
)
```

- [ ] **Step 3: Update `koComplete` and add `thirdsComplete`**

Replace:
```tsx
const koComplete = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
  && KNOCKOUT_MATCHES
    .filter(m => m.round === 'R32' && m.slotB.startsWith('Best 3rd'))
    .every(m => !!picks[m.id]?.teamB)
```
With:
```tsx
const thirdsComplete = advancingThirds.size === 8
const koComplete = KNOCKOUT_MATCHES.every(m => !!picks[m.id]?.winner)
```

- [ ] **Step 4: Update the load effect — parse `WILDCARD_N` records**

Replace:
```tsx
const q: Record<string, string> = {}
const w: Record<string, string> = {}
for (const p of data.knockoutPredictions as KnockoutPrediction[]) {
  if (p.match_id.endsWith(':qualifier')) q[p.match_id.replace(':qualifier', '')] = p.predicted_winner
  else w[p.match_id] = p.predicted_winner
}
setQualifiers(q)
setWinners(w)
```
With:
```tsx
const advancing = new Set<string>()
const w: Record<string, string> = {}
for (const p of data.knockoutPredictions as KnockoutPrediction[]) {
  if (p.match_id.startsWith('WILDCARD_')) advancing.add(p.predicted_winner)
  else w[p.match_id] = p.predicted_winner
}
setAdvancingThirds(advancing)
setWinners(w)
```

- [ ] **Step 5: Update `buildPayload` — write `WILDCARD_N` records**

Replace:
```tsx
const knockoutPredictions = [
  ...Object.entries(winners).map(([match_id, predicted_winner]) => ({ match_id, predicted_winner })),
  ...Object.entries(qualifiers).map(([match_id, predicted_winner]) => ({ match_id: match_id + ':qualifier', predicted_winner })),
]
```
With:
```tsx
const knockoutPredictions = [
  ...Object.entries(winners).map(([match_id, predicted_winner]) => ({ match_id, predicted_winner })),
  ...[...advancingThirds].map((g, i) => ({ match_id: `WILDCARD_${i + 1}`, predicted_winner: g })),
]
```

- [ ] **Step 6: Update `handlePick`**

Replace:
```tsx
const handlePick = useCallback((matchId: string, field: 'teamB' | 'winner', teamCode: string) => {
  if (field === 'teamB') setQualifiers(prev => ({ ...prev, [matchId]: teamCode }))
  else setWinners(prev => ({ ...prev, [matchId]: teamCode }))
}, [])
```
With:
```tsx
const handlePick = useCallback((matchId: string, winner: string) => {
  setWinners(prev => ({ ...prev, [matchId]: winner }))
}, [])
```

- [ ] **Step 7: Add `handleAdvancingThirdsChange` callback**

Add after `handlePick`:
```tsx
const handleAdvancingThirdsChange = useCallback((code: string, val: boolean) => {
  setAdvancingThirds(prev => {
    const next = new Set(prev)
    if (val) next.add(code)
    else next.delete(code)
    return next
  })
}, [])
```

- [ ] **Step 8: Update `submitBracket` validation**

Replace:
```tsx
if (!groupsComplete || !koComplete) {
  setShowValidation(true)
  setSubmitAttempt(n => n + 1)
  if (!koComplete) setBracketTab('knockouts')
  return
}
```
With:
```tsx
if (!groupsComplete || !thirdsComplete || !koComplete) {
  setShowValidation(true)
  setSubmitAttempt(n => n + 1)
  if (!thirdsComplete) setBracketTab('groups')
  else if (!koComplete) setBracketTab('knockouts')
  return
}
```

- [ ] **Step 9: Update `resetBracket` — clear `advancingThirds`**

Add `setAdvancingThirds(new Set())` alongside the other resets:
```tsx
setGroupRankings(defaultRankings)
setAdvancingThirds(new Set())
setWinners({})
```

- [ ] **Step 10: Update `<BracketEditor />` JSX props**

Replace the `<BracketEditor />` call:
```tsx
<BracketEditor
  groupRankings={groupRankings}
  advancingThirds={advancingThirds}
  winners={winners}
  onGroupChange={(code, order) => setGroupRankings(prev => ({ ...prev, [code]: order }))}
  onAdvancingThirdsChange={handleAdvancingThirdsChange}
  onPick={handlePick}
  disabled={isDisabled}
  showValidation={showValidation}
  submitAttempt={submitAttempt}
  tab={bracketTab}
  onTabChange={setBracketTab}
/>
```

- [ ] **Step 11: Verify no TypeScript errors**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 12: Run all tests**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 13: Commit**

```bash
git add app/bracket/page.tsx
git commit -m "feat: replace qualifier dropdowns with advancingThirds checkboxes in bracket page"
```

---

## Task 7: Update `app/admin/page.tsx`

**Files:**
- Modify: `app/admin/page.tsx`

The admin page uses `BracketEditor` to enter actual results, including qualifier slots. It needs the same `advancingThirds` treatment as the player bracket page.

- [ ] **Step 1: Replace `qualifiers` state with `advancingThirds`**

Replace:
```tsx
const [qualifiers, setQualifiers] = useState<Record<string, string>>(() => {
  const q: Record<string, string> = {}
  for (const r of initialResults.filter(r => r.result_type === 'knockout' && r.ref_id.endsWith(':qualifier')))
    q[r.ref_id.replace(':qualifier', '')] = r.team_code
  return q
})
```
With:
```tsx
const [advancingThirds, setAdvancingThirds] = useState<Set<string>>(() => {
  const s = new Set<string>()
  for (const r of initialResults.filter(r => r.result_type === 'knockout' && r.ref_id.startsWith('WILDCARD_')))
    s.add(r.team_code)
  return s
})
```

- [ ] **Step 2: Update `saveKnockout` to write WILDCARD records**

Replace:
```tsx
const entries = [
  ...Object.entries(winners).map(([ref_id, team_code]) => ({ ref_id, team_code })),
  ...Object.entries(qualifiers).map(([ref_id, team_code]) => ({ ref_id: ref_id + ':qualifier', team_code })),
]
```
With:
```tsx
const entries = [
  ...Object.entries(winners).map(([ref_id, team_code]) => ({ ref_id, team_code })),
  ...[...advancingThirds].map((g, i) => ({ ref_id: `WILDCARD_${i + 1}`, team_code: g })),
]
```

- [ ] **Step 3: Update `resetKnockout` to clear `advancingThirds`**

Add `setAdvancingThirds(new Set())` alongside `setWinners({})`:
```tsx
setWinners({})
setAdvancingThirds(new Set())
```

- [ ] **Step 4: Update `<BracketEditor />` props in the JSX**

Replace:
```tsx
<BracketEditor
  groupRankings={groupRankings}
  qualifiers={qualifiers}
  winners={winners}
  onGroupChange={(code, order) => setGroupRankings(prev => ({ ...prev, [code]: order }))}
  onPick={(matchId, field, teamCode) => {
    if (field === 'teamB') setQualifiers(prev => ({ ...prev, [matchId]: teamCode }))
    else setWinners(prev => ({ ...prev, [matchId]: teamCode }))
  }}
  onTabChange={setBracketTab}
/>
```
With:
```tsx
<BracketEditor
  groupRankings={groupRankings}
  advancingThirds={advancingThirds}
  winners={winners}
  onGroupChange={(code, order) => setGroupRankings(prev => ({ ...prev, [code]: order }))}
  onAdvancingThirdsChange={(code, val) => {
    setAdvancingThirds(prev => {
      const next = new Set(prev)
      if (val) next.add(code)
      else next.delete(code)
      return next
    })
  }}
  onPick={(matchId, winner) => setWinners(prev => ({ ...prev, [matchId]: winner }))}
  onTabChange={setBracketTab}
/>
```

- [ ] **Step 5: Verify no TypeScript errors**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: update admin panel to use advancingThirds checkboxes and WILDCARD format"
```

---

## Task 8: One-time migration script + tests

**Files:**
- Create: `scripts/migrate-qualifiers.ts`
- Create: `__tests__/migrate-qualifiers.test.ts`

This script converts existing `MXX:qualifier` records to `WILDCARD_N | groupCode` format.
The core extraction logic is exported so it can be unit-tested in isolation from Supabase.

### Background: what the migration preserves

When we verified against real DB brackets, the migration extracts advancing groups correctly
in all cases. For most brackets all 8 original 3rd-place teams still appear in some R32 slot
(just shuffled by the algorithm). One edge case exists: if a group's only eligible match has
already been taken by an alphabetically-earlier group, that team is stranded and its slot is
left empty. This is a known consequence of the new deterministic algorithm and is tested explicitly.

Real brackets verified:
- `7121194f`: {A,D,E,F,H,I,J,L} → all 8 teams assigned (different slots)
- `cb2c0409`: {A,B,C,D,E,F,I,J} → all 8 teams assigned (different slots)
- `d806341e`: {A,C,D,E,F,I,J,L} → 7/8 teams assigned; GHA(L) stranded because L is only
  eligible for M87 but D takes it first — M85 left empty

- [ ] **Step 1: Write failing tests for `migrateQualifiers`**

Create `__tests__/migrate-qualifiers.test.ts`:

```typescript
import { GROUPS } from '@/data/groups'
import { buildQualifiers } from '@/data/bracket'
import { migrateQualifiers } from '@/scripts/migrate-qualifiers'

// Helpers
function makeRankings(thirds: Record<string, string>): Record<string, string[]> {
  const r: Record<string, string[]> = {}
  for (const [g, third] of Object.entries(thirds)) r[g] = ['_', '_', third, '_']
  return r
}

// ── Real bracket data from DB snapshot (2026-06-14) ──────────────────────────

const BRACKETS = {
  // 7121194f: all 8 teams preserved after migration (different slots)
  '7121194f': {
    qualifiers: [
      { match_id: 'M74:qualifier', predicted_winner: 'KOR' },
      { match_id: 'M77:qualifier', predicted_winner: 'USA' },
      { match_id: 'M79:qualifier', predicted_winner: 'SEN' },
      { match_id: 'M80:qualifier', predicted_winner: 'ALG' },
      { match_id: 'M81:qualifier', predicted_winner: 'CIV' },
      { match_id: 'M82:qualifier', predicted_winner: 'KSA' },
      { match_id: 'M85:qualifier', predicted_winner: 'JPN' },
      { match_id: 'M87:qualifier', predicted_winner: 'GHA' },
    ],
    thirds: {
      A:'KOR', B:'QAT', C:'SCO', D:'USA', E:'CIV',
      F:'JPN', G:'NZL', H:'KSA', I:'SEN', J:'ALG', K:'UZB', L:'GHA',
    },
    expectedGroups: new Set(['A', 'D', 'E', 'F', 'H', 'I', 'J', 'L']),
  },
  // cb2c0409: all 8 teams preserved after migration (different slots)
  'cb2c0409': {
    qualifiers: [
      { match_id: 'M74:qualifier', predicted_winner: 'CZE' },
      { match_id: 'M77:qualifier', predicted_winner: 'SWE' },
      { match_id: 'M79:qualifier', predicted_winner: 'SCO' },
      { match_id: 'M80:qualifier', predicted_winner: 'SEN' },
      { match_id: 'M81:qualifier', predicted_winner: 'BIH' },
      { match_id: 'M82:qualifier', predicted_winner: 'ALG' },
      { match_id: 'M85:qualifier', predicted_winner: 'CIV' },
      { match_id: 'M87:qualifier', predicted_winner: 'AUS' },
    ],
    thirds: {
      A:'CZE', B:'BIH', C:'SCO', D:'AUS', E:'CIV',
      F:'SWE', G:'IRN', H:'KSA', I:'SEN', J:'ALG', K:'UZB', L:'PAN',
    },
    expectedGroups: new Set(['A', 'B', 'C', 'D', 'E', 'F', 'I', 'J']),
  },
  // d806341e: GHA(L) stranded — L only eligible for M87 but D takes it first
  'd806341e': {
    qualifiers: [
      { match_id: 'M74:qualifier', predicted_winner: 'KOR' },
      { match_id: 'M77:qualifier', predicted_winner: 'PAR' },
      { match_id: 'M79:qualifier', predicted_winner: 'SCO' },
      { match_id: 'M80:qualifier', predicted_winner: 'ECU' },
      { match_id: 'M81:qualifier', predicted_winner: 'SWE' },
      { match_id: 'M82:qualifier', predicted_winner: 'SEN' },
      { match_id: 'M85:qualifier', predicted_winner: 'JOR' },
      { match_id: 'M87:qualifier', predicted_winner: 'GHA' },
    ],
    thirds: {
      A:'KOR', B:'BIH', C:'SCO', D:'PAR', E:'ECU',
      F:'SWE', G:'IRN', H:'KSA', I:'SEN', J:'JOR', K:'COD', L:'GHA',
    },
    expectedGroups: new Set(['A', 'C', 'D', 'E', 'F', 'I', 'J', 'L']),
  },
} as const

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('migrateQualifiers — group extraction', () => {
  it('correctly extracts advancing groups for bracket 7121194f', () => {
    const b = BRACKETS['7121194f']
    expect(migrateQualifiers(b.qualifiers)).toEqual(b.expectedGroups)
  })

  it('correctly extracts advancing groups for bracket cb2c0409', () => {
    const b = BRACKETS['cb2c0409']
    expect(migrateQualifiers(b.qualifiers)).toEqual(b.expectedGroups)
  })

  it('correctly extracts advancing groups for bracket d806341e', () => {
    const b = BRACKETS['d806341e']
    expect(migrateQualifiers(b.qualifiers)).toEqual(b.expectedGroups)
  })

  it('returns empty set when no qualifier rows provided', () => {
    expect(migrateQualifiers([])).toEqual(new Set())
  })

  it('ignores rows whose team code is not in any group', () => {
    expect(migrateQualifiers([
      { match_id: 'M74:qualifier', predicted_winner: 'UNKNOWN' },
    ])).toEqual(new Set())
  })
})

describe('migrateQualifiers + buildQualifiers — knockout stage integrity', () => {
  it('7121194f: all 8 original 3rd-place teams appear in the new slot assignments', () => {
    const b = BRACKETS['7121194f']
    const advancingThirds = migrateQualifiers(b.qualifiers)
    const rankings = makeRankings(b.thirds)
    const newQualifiers = buildQualifiers(rankings, advancingThirds)

    const originalTeams = new Set(b.qualifiers.map(q => q.predicted_winner))
    const assignedTeams = new Set(Object.values(newQualifiers))
    expect(assignedTeams).toEqual(originalTeams)
  })

  it('cb2c0409: all 8 original 3rd-place teams appear in the new slot assignments', () => {
    const b = BRACKETS['cb2c0409']
    const advancingThirds = migrateQualifiers(b.qualifiers)
    const rankings = makeRankings(b.thirds)
    const newQualifiers = buildQualifiers(rankings, advancingThirds)

    const originalTeams = new Set(b.qualifiers.map(q => q.predicted_winner))
    const assignedTeams = new Set(Object.values(newQualifiers))
    expect(assignedTeams).toEqual(originalTeams)
  })

  it('d806341e: groups extracted correctly; GHA(L) is stranded because L is only eligible for M87 and D takes it first', () => {
    const b = BRACKETS['d806341e']
    const advancingThirds = migrateQualifiers(b.qualifiers)
    const rankings = makeRankings(b.thirds)
    const newQualifiers = buildQualifiers(rankings, advancingThirds)

    // Groups are correct — all 8 extracted
    expect(advancingThirds).toEqual(b.expectedGroups)

    // M87 is taken by D (PAR), not L (GHA)
    expect(newQualifiers['M87']).toBe('PAR')

    // GHA is not in any slot; M85 is empty
    expect(Object.values(newQualifiers)).not.toContain('GHA')
    expect(newQualifiers['M85']).toBeUndefined()

    // The remaining 7 teams are all assigned
    const assignedTeams = new Set(Object.values(newQualifiers))
    const originalTeams = new Set(b.qualifiers.map(q => q.predicted_winner))
    const stranded = [...originalTeams].filter(t => !assignedTeams.has(t))
    expect(stranded).toEqual(['GHA'])
  })

  it('every assigned team is actually the 3rd-place of an advancing group', () => {
    for (const [id, b] of Object.entries(BRACKETS)) {
      const advancingThirds = migrateQualifiers(b.qualifiers)
      const rankings = makeRankings(b.thirds)
      const newQualifiers = buildQualifiers(rankings, advancingThirds)

      for (const [matchId, team] of Object.entries(newQualifiers)) {
        const group = Object.entries(b.thirds).find(([, t]) => t === team)?.[0]
        expect(advancingThirds.has(group!)).toBe(true)
      }
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx jest __tests__/migrate-qualifiers.test.ts --no-coverage
```

Expected: FAIL — `migrateQualifiers is not a function`

- [ ] **Step 3: Create `scripts/migrate-qualifiers.ts` with exported `migrateQualifiers`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { GROUPS } from '../data/groups'
import { readFileSync } from 'fs'

// Load .env.local (dotenv not available as a dependency)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const [k, ...rest] = line.split('=')
      if (k && !k.startsWith('#')) process.env[k.trim()] = rest.join('=').trim()
    }
  } catch { /* running in test environment */ }
}

// Reverse map: teamCode → groupCode
const TEAM_TO_GROUP: Record<string, string> = {}
for (const [group, teams] of Object.entries(GROUPS)) {
  for (const team of teams) TEAM_TO_GROUP[team] = group
}

// Exported for testing. Converts old qualifier rows to the set of advancing group codes.
export function migrateQualifiers(
  qualifierRows: Array<{ predicted_winner: string }>,
): Set<string> {
  const groups = new Set<string>()
  for (const row of qualifierRows) {
    const group = TEAM_TO_GROUP[row.predicted_winner]
    if (group) groups.add(group)
  }
  return groups
}

async function migrate() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: qualifierRows, error: fetchError } = await supabase
    .from('knockout_predictions')
    .select('id, bracket_id, match_id, predicted_winner')
    .like('match_id', '%:qualifier')

  if (fetchError) throw fetchError

  if (!qualifierRows || qualifierRows.length === 0) {
    console.log('No :qualifier records found. Nothing to migrate.')
    return
  }

  console.log(`Found ${qualifierRows.length} qualifier records across brackets.`)

  // Group by bracket_id
  const byBracket: Record<string, typeof qualifierRows> = {}
  for (const row of qualifierRows) {
    if (!byBracket[row.bracket_id]) byBracket[row.bracket_id] = []
    byBracket[row.bracket_id].push(row)
  }

  // Build new WILDCARD records: one per advancing group per bracket
  const newRecords: { bracket_id: string; match_id: string; predicted_winner: string }[] = []
  for (const [bracketId, rows] of Object.entries(byBracket)) {
    const groups = [...migrateQualifiers(rows)]
    for (let i = 0; i < groups.length; i++) {
      newRecords.push({
        bracket_id: bracketId,
        match_id: `WILDCARD_${i + 1}`,
        predicted_winner: groups[i],
      })
    }
  }

  console.log(`Inserting ${newRecords.length} new WILDCARD records…`)
  const { error: insertError } = await supabase
    .from('knockout_predictions')
    .insert(newRecords)
  if (insertError) throw insertError

  const oldIds = qualifierRows.map(r => r.id)
  console.log(`Deleting ${oldIds.length} old :qualifier records…`)
  const { error: deleteError } = await supabase
    .from('knockout_predictions')
    .delete()
    .in('id', oldIds)
  if (deleteError) throw deleteError

  console.log('Migration complete.')
}

// Only run when executed directly, not when imported by tests
if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx jest __tests__/migrate-qualifiers.test.ts --no-coverage
```

Expected: PASS — 9 tests pass

- [ ] **Step 5: Run all tests to confirm nothing broken**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 6: Run migration against the database**

```bash
cd /Users/andrei/dev/fifa2026bracketpreditor && npx tsx scripts/migrate-qualifiers.ts
```

Expected output:
```
Found N qualifier records across brackets.
Inserting M new WILDCARD records…
Deleting N old :qualifier records…
Migration complete.
```

- [ ] **Step 7: Commit**

```bash
git add scripts/migrate-qualifiers.ts __tests__/migrate-qualifiers.test.ts
git commit -m "chore: add migration script and tests for qualifier → WILDCARD_N format"
```
