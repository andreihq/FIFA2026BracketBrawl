# Scoring Wildcard Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move wildcard (advancing 3rd-place) points out of the knockout bucket into the group bucket using set-membership matching, and keep knockout points limited to real matches where a picked team progresses.

**Architecture:** All scoring logic lives in one pure function, `computeScore` in `lib/scoring.ts`, returning `{ groupPoints, knockoutPoints, total }` (shape unchanged). Wildcards are stored as knockout records with `match_id`/`ref_id` of `WILDCARD_1..8` and a group letter as the value; we detect them by the `WILDCARD_` prefix. Wildcard points fold into `groupPoints`; real knockout records (everything not prefixed `WILDCARD_`) feed `knockoutPoints`. UI changes are copy-only since the return shape does not change.

**Tech Stack:** TypeScript, Next.js (App Router), Jest (ts-jest), `@/` path alias.

## Global Constraints

- Return shape of `computeScore` MUST stay `{ groupPoints: number; knockoutPoints: number; total: number }`.
- `total` MUST equal `groupPoints + knockoutPoints`.
- Wildcard detection key: `match_id` (predictions) / `ref_id` (results) starting with the exact string `"WILDCARD_"`.
- Each correct group rank = 1 point; each correct wildcard = 1 point; each correct knockout progression = 1 point. No other weights.
- Wildcard scoring is set-membership (unordered), NOT index-matched.
- Run tests with: `npx jest __tests__/scoring.test.ts`.
- Do NOT commit unless the user explicitly asks (standing repo policy: no auto-commits/pushes).

---

### Task 1: Rewrite `computeScore` scoring logic

**Files:**
- Modify: `lib/scoring.ts:1-29` (the whole `computeScore` function)
- Test: `__tests__/scoring.test.ts`

**Interfaces:**
- Consumes (from `@/types`, unchanged):
  - `GroupPrediction { id; bracket_id; group_code; team_code; predicted_pos: number }`
  - `KnockoutPrediction { id; bracket_id; match_id: string; predicted_winner: string }`
  - `ActualResult { id; result_type: 'group' | 'knockout'; ref_id: string; team_code: string; position: number | null; entered_at: string }`
- Produces:
  - `computeScore(groupPredictions: GroupPrediction[], knockoutPredictions: KnockoutPrediction[], actualResults: ActualResult[]): { groupPoints: number; knockoutPoints: number; total: number }`

- [ ] **Step 1: Add the failing tests**

Append these tests inside the existing `describe('computeScore', ...)` block in `__tests__/scoring.test.ts`. They reuse the existing `groupPreds` const and define local knockout predictions with wildcards.

```typescript
  it('awards wildcard points into groupPoints (not knockoutPoints)', () => {
    const preds: KnockoutPrediction[] = [
      { id: 'w1', bracket_id: 'b1', match_id: 'WILDCARD_1', predicted_winner: 'C' },
      { id: 'w2', bracket_id: 'b1', match_id: 'WILDCARD_2', predicted_winner: 'D' },
    ]
    const results: ActualResult[] = [
      { id: 'a1', result_type: 'knockout', ref_id: 'WILDCARD_1', team_code: 'C', position: null, entered_at: '' },
      { id: 'a2', result_type: 'knockout', ref_id: 'WILDCARD_2', team_code: 'D', position: null, entered_at: '' },
    ]
    expect(computeScore(groupPreds, preds, results)).toEqual({ groupPoints: 2, knockoutPoints: 0, total: 2 })
  })

  it('scores wildcards by set membership regardless of WILDCARD index', () => {
    const preds: KnockoutPrediction[] = [
      { id: 'w1', bracket_id: 'b1', match_id: 'WILDCARD_1', predicted_winner: 'C' },
    ]
    // Actual stored same group under a different index
    const results: ActualResult[] = [
      { id: 'a1', result_type: 'knockout', ref_id: 'WILDCARD_5', team_code: 'C', position: null, entered_at: '' },
    ]
    expect(computeScore(groupPreds, preds, results)).toEqual({ groupPoints: 1, knockoutPoints: 0, total: 1 })
  })

  it('does not award wildcard points for a wrong pick', () => {
    const preds: KnockoutPrediction[] = [
      { id: 'w1', bracket_id: 'b1', match_id: 'WILDCARD_1', predicted_winner: 'C' },
    ]
    const results: ActualResult[] = [
      { id: 'a1', result_type: 'knockout', ref_id: 'WILDCARD_1', team_code: 'H', position: null, entered_at: '' },
    ]
    expect(computeScore(groupPreds, preds, results)).toEqual({ groupPoints: 0, knockoutPoints: 0, total: 0 })
  })

  it('does not count WILDCARD results toward knockoutPoints', () => {
    const preds: KnockoutPrediction[] = [
      { id: 'w1', bracket_id: 'b1', match_id: 'WILDCARD_1', predicted_winner: 'C' },
      { id: 'k1', bracket_id: 'b1', match_id: 'R32-M1', predicted_winner: 'BRA' },
    ]
    const results: ActualResult[] = [
      { id: 'a1', result_type: 'knockout', ref_id: 'WILDCARD_1', team_code: 'C', position: null, entered_at: '' },
      { id: 'a2', result_type: 'knockout', ref_id: 'R32-M1', team_code: 'BRA', position: null, entered_at: '' },
    ]
    expect(computeScore(groupPreds, preds, results)).toEqual({ groupPoints: 1, knockoutPoints: 1, total: 2 })
  })

  it('accumulates group ranks, wildcards, and knockout progressions into the right buckets', () => {
    const preds: KnockoutPrediction[] = [
      { id: 'w1', bracket_id: 'b1', match_id: 'WILDCARD_1', predicted_winner: 'C' },
      { id: 'w2', bracket_id: 'b1', match_id: 'WILDCARD_2', predicted_winner: 'D' },
      { id: 'k1', bracket_id: 'b1', match_id: 'R32-M1', predicted_winner: 'BRA' },
      { id: 'k2', bracket_id: 'b1', match_id: 'FINAL', predicted_winner: 'ARG' },
    ]
    const results: ActualResult[] = [
      { id: 'g1', result_type: 'group',    ref_id: 'A',          team_code: 'BRA', position: 1,    entered_at: '' },
      { id: 'g2', result_type: 'group',    ref_id: 'A',          team_code: 'ARG', position: 2,    entered_at: '' },
      { id: 'a1', result_type: 'knockout', ref_id: 'WILDCARD_3', team_code: 'C',   position: null, entered_at: '' },
      { id: 'a2', result_type: 'knockout', ref_id: 'WILDCARD_4', team_code: 'D',   position: null, entered_at: '' },
      { id: 'a3', result_type: 'knockout', ref_id: 'R32-M1',     team_code: 'BRA', position: null, entered_at: '' },
      { id: 'a4', result_type: 'knockout', ref_id: 'FINAL',      team_code: 'FRA', position: null, entered_at: '' },
    ]
    // group ranks: BRA#1 + ARG#2 = 2; wildcards: C,D = 2 -> groupPoints 4
    // knockout: R32-M1 BRA correct = 1; FINAL predicted ARG but FRA won = 0 -> knockoutPoints 1
    expect(computeScore(groupPreds, preds, results)).toEqual({ groupPoints: 4, knockoutPoints: 1, total: 5 })
  })
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx jest __tests__/scoring.test.ts`
Expected: The 5 new tests FAIL (e.g. wildcard tests get `knockoutPoints: 2` instead of `groupPoints: 2`), existing 5 tests PASS.

- [ ] **Step 3: Rewrite `computeScore`**

Replace the entire contents of `lib/scoring.ts` with:

```typescript
import type { GroupPrediction, KnockoutPrediction, ActualResult } from '@/types'

const WILDCARD_PREFIX = 'WILDCARD_'

export function computeScore(
  groupPredictions: GroupPrediction[],
  knockoutPredictions: KnockoutPrediction[],
  actualResults: ActualResult[]
): { groupPoints: number; knockoutPoints: number; total: number } {
  let groupPoints = 0
  let knockoutPoints = 0

  // Group-stage ranks: 1 point per correctly guessed (group, team, rank).
  for (const result of actualResults) {
    if (result.result_type === 'group' && result.position !== null) {
      const hit = groupPredictions.find(
        p =>
          p.group_code === result.ref_id &&
          p.team_code === result.team_code &&
          p.predicted_pos === result.position
      )
      if (hit) groupPoints++
    }
  }

  // Wildcards (advancing 3rd-place groups): set-membership, fold into groupPoints.
  const predictedThirds = new Set(
    knockoutPredictions
      .filter(p => p.match_id.startsWith(WILDCARD_PREFIX))
      .map(p => p.predicted_winner)
  )
  const actualThirds = new Set(
    actualResults
      .filter(r => r.result_type === 'knockout' && r.ref_id.startsWith(WILDCARD_PREFIX))
      .map(r => r.team_code)
  )
  for (const group of predictedThirds) {
    if (actualThirds.has(group)) groupPoints++
  }

  // Knockout progression: 1 point per real match (non-wildcard) where the
  // picked team won and therefore progressed.
  for (const result of actualResults) {
    if (result.result_type === 'knockout' && !result.ref_id.startsWith(WILDCARD_PREFIX)) {
      const hit = knockoutPredictions.find(
        p => p.match_id === result.ref_id && p.predicted_winner === result.team_code
      )
      if (hit) knockoutPoints++
    }
  }

  return { groupPoints, knockoutPoints, total: groupPoints + knockoutPoints }
}
```

- [ ] **Step 4: Run the tests to verify all pass**

Run: `npx jest __tests__/scoring.test.ts`
Expected: All 10 tests PASS.

- [ ] **Step 5: Commit (only if the user has asked you to commit)**

```bash
git add lib/scoring.ts __tests__/scoring.test.ts
git commit -m "feat: score wildcards in group bucket via set membership, exclude from knockout"
```

---

### Task 2: Update GS label copy to reflect wildcards

**Files:**
- Modify: `components/Leaderboard.tsx:26` (GS column tooltip)
- Modify: `app/player/[username]/page.tsx` (the Group-points label near line 61)

**Interfaces:**
- Consumes: `computeScore` return `{ groupPoints, knockoutPoints, total }` (unchanged — no code/type changes, copy only).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Update the Leaderboard GS tooltip**

In `components/Leaderboard.tsx`, change the GS header cell title:

```tsx
        <div className="text-right" title="Group Stage + Wildcard points">GS</div>
```

(was `title="Group Stage points"`)

- [ ] **Step 2: Update the player page Group label**

Open `app/player/[username]/page.tsx` and locate the label text rendered above `{score.groupPoints}` (around line 58-62). Update that visible label so it reads to include wildcards, e.g. change the word "Group" / "Group Stage" to "Group + Wildcard". Match the surrounding JSX/markup exactly — only the human-readable label text changes, not `score.groupPoints`.

For example, if it currently reads:

```tsx
<span className="...">Group Stage</span>
```

change it to:

```tsx
<span className="...">Group + Wildcard</span>
```

If the existing label is just "Group", change it to "Group + Wildcard". Do not alter the number binding or layout classes.

- [ ] **Step 3: Verify the app type-checks / builds**

Run: `npx tsc --noEmit`
Expected: No new type errors from these edits (copy-only change).

- [ ] **Step 4: Commit (only if the user has asked you to commit)**

```bash
git add components/Leaderboard.tsx "app/player/[username]/page.tsx"
git commit -m "chore: label GS column as Group + Wildcard"
```

---

## Self-Review

**Spec coverage:**
- Group ranks 1pt each → Task 1, Step 3 (first loop). ✅
- Wildcards 1pt each, set-membership, in group bucket → Task 1, Step 3 (predictedThirds/actualThirds intersection). ✅
- Knockout no wildcard points; 1pt per progression → Task 1, Step 3 (third loop excludes `WILDCARD_` prefix). ✅
- Return shape unchanged → Global Constraints + Task 1 Interfaces. ✅
- Label clarity (Leaderboard tooltip + player page) → Task 2. ✅
- Tests enumerated in spec → Task 1, Step 1 covers all 5 added cases plus existing 5 retained. ✅

**Placeholder scan:** No TBD/TODO; all code shown in full; the one descriptive step (Task 2 Step 2) is unavoidable because exact current label text must be read in-file, but it gives concrete before/after examples. ✅

**Type consistency:** `computeScore` signature and `{ groupPoints, knockoutPoints, total }` return match across Global Constraints, Task 1 Interfaces, and implementation. `WILDCARD_PREFIX` used consistently. ✅
