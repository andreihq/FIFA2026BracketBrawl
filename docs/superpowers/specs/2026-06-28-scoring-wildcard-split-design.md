# Scoring Update: Group/Wildcard vs Knockout — Design

**Date:** 2026-06-28
**Status:** Approved (pending spec review)

## Goal

Change how points are awarded so that:

- **Group stage:** 1 point per correctly guessed rank of each team in a group.
- **Wildcards:** 1 point per correctly picked wildcard (an advancing 3rd-place team). These points belong to the **group/wildcard bucket**.
- **Knockout stage:** **No** points for wildcards. 1 point only when a picked team progresses to the next round (i.e., your picked winner of a real knockout match actually won that match).

## Context (current behavior)

`lib/scoring.ts` exposes `computeScore(groupPredictions, knockoutPredictions, actualResults)` returning `{ groupPoints, knockoutPoints, total }`.

Data model facts:

- **Group predictions/results** carry `(group_code, team_code, predicted_pos|position)`.
- **Wildcards** (the 8 advancing 3rd-place groups) are stored as **knockout** records:
  - Prediction: `match_id = "WILDCARD_1".."WILDCARD_8"`, `predicted_winner = <group letter>`.
  - Actual result: `result_type = "knockout"`, `ref_id = "WILDCARD_1".."WILDCARD_8"`, `team_code = <group letter>`.
- **Real knockout matches** use `match_id`/`ref_id` like `R32-M1`, `R16-M1`, `QF-M1`, `SF-M1`, `3RD`, `FINAL`.

Current problems this design fixes:

1. Wildcard records are counted under `knockoutPoints` (should be group/wildcard bucket, and knockout should ignore them).
2. Wildcards are matched by arbitrary index (`WILDCARD_1` vs `WILDCARD_1`), but the 8 picks are an unordered **set** of groups — index matching is incorrect.

## Design

Single change point: `computeScore` in `lib/scoring.ts`. **Return shape is unchanged** (`{ groupPoints, knockoutPoints, total }`), so leaderboard/player-page structure is unaffected. Wildcard points fold into `groupPoints`.

### Group & Wildcard bucket (`groupPoints`)

- **Group ranks (unchanged):** for each actual result with `result_type === 'group'` and `position !== null`, +1 if some group prediction matches `(group_code === ref_id, team_code, predicted_pos === position)`.
- **Wildcards (new, set-membership):**
  - `actualThirds` = set of `team_code` from actual results where `result_type === 'knockout'` and `ref_id` starts with `"WILDCARD_"`.
  - `predictedThirds` = set of `predicted_winner` from knockout predictions where `match_id` starts with `"WILDCARD_"`.
  - Add to `groupPoints`: the count of `predictedThirds` members that are also in `actualThirds` (intersection size, max 8).

### Knockout bucket (`knockoutPoints`)

- For each actual result with `result_type === 'knockout'` **whose `ref_id` does NOT start with `"WILDCARD_"`**, +1 if some knockout prediction matches `(match_id === ref_id, predicted_winner === team_code)`.
- Wildcards are excluded here.

### Total

`total = groupPoints + knockoutPoints` (unchanged).

## Display / label clarity

No structural UI changes. Update copy so "GS" reflects its new meaning:

- `components/Leaderboard.tsx`: GS column tooltip `"Group Stage points"` → `"Group Stage + Wildcard points"`.
- `app/player/[username]/page.tsx`: matching Group label updated to indicate it includes wildcards.

## Testing (`__tests__/scoring.test.ts`)

Existing tests use `R32-M1`/`FINAL` (not `WILDCARD_*`) and continue to pass unchanged. Add:

1. Correct wildcard pick increments `groupPoints` (not `knockoutPoints`).
2. Set-membership: player and actual assign the same group to **different** `WILDCARD_n` indices → still scored (proves set-based, not index-based).
3. A `WILDCARD_*` actual result contributes **0** to `knockoutPoints`.
4. Wrong wildcard pick → 0.
5. Combined case: group ranks + wildcards land in `groupPoints`; real knockout winners land in `knockoutPoints`; `total` adds correctly.

## Out of scope

- No changes to how predictions/results are stored (WILDCARD_N records remain `result_type: 'knockout'`).
- No leaderboard column additions; no scoring weights beyond 1 point each.
