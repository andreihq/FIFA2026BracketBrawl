# Player Scorecard — Design Spec

**Date:** 2026-06-12  
**Status:** Approved

---

## Overview

Add a scorecard card to the top of the player bracket page (`/player/[username]`) that displays the player's current Group Stage points, Knockout points, and Total score. The card is always visible (even when the score is 0/0/0) and uses the same `computeScore` function that powers the league leaderboard.

---

## Data Layer

- `computeScore(groupPredictions, knockoutPredictions, actualResults)` is called in the server component (`app/player/[username]/page.tsx`).
- All three data arrays are already fetched in the existing page. No new queries needed.
- If the player has no bracket, the arrays are already `[]`, producing `{ groupPoints: 0, knockoutPoints: 0, total: 0 }`.
- The computed score is used inline in the JSX — no new props or components required.

---

## Rendering

**Placement:** Inside the `{bracket && (...)}` block, between the player header section and the tab buttons.

**Structure:**
```
┌─────────────────────────────────────────────┐
│  GROUP STAGE    │   KNOCKOUT    │   TOTAL    │
│       3         │      2        │     5      │
└─────────────────────────────────────────────┘
```

- Outer wrapper: `card` class (rounded-xl, surface background, border)
- Inner: `grid grid-cols-3`
- Each cell: centered, `section-label` text above, `font-display text-4xl` number below
- Dividers: `border-r border-pitch-600` on first two cells
- Total number: `text-gold`
- Group Stage and Knockout numbers: `text-[#EBF0FF]`

**Visibility rule:** Scorecard only renders when `bracket` exists (consistent with the rest of the bracket section — tabs + BracketView are also gated on this condition).

---

## Implementation Scope

- Edit `app/player/[username]/page.tsx` only.
- Import `computeScore` from `@/lib/scoring` (already used in the league page).
- No new component file — inline JSX is sufficient for a three-column stat card.
- No changes to `BracketView`, `Leaderboard`, or `computeScore`.

---

## Out of Scope

- Rank or position relative to league (not shown — player page is standalone).
- Points breakdown per match (just the totals, same as leaderboard).
- Animations beyond existing `anim-fade-up anim-delay-1` pattern.
