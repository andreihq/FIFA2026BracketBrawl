# Player Scorecard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-column scorecard card (Group Stage / Knockout / Total) to the player bracket page, rendered between the player header and the tab buttons.

**Architecture:** `computeScore` is imported into the server component and called with the already-fetched prediction/result arrays. The score is rendered as inline JSX — no new component file needed. Animation delays on the tab buttons and BracketView are bumped by one to accommodate the new element.

**Tech Stack:** Next.js 14 App Router (server component), Tailwind CSS, Stadium Night design tokens

---

### Task 1: Add scorecard to player page

**Files:**
- Modify: `app/player/[username]/page.tsx`

- [ ] **Step 1: Run existing tests to establish a clean baseline**

```bash
npm test
```

Expected: all tests pass (scoring.test.ts + league-code.test.ts).

- [ ] **Step 2: Replace the full contents of `app/player/[username]/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { computeScore } from '@/lib/scoring'
import { BracketView } from '@/components/BracketView'
import Link from 'next/link'

export default async function PlayerPage({ params, searchParams }: {
  params: { username: string }
  searchParams: { from?: string; tab?: string }
}) {
  const session = await getSession()
  if (!session.playerId) redirect('/')

  const supabase = createServerClient()
  const { data: player } = await supabase
    .from('players').select('id, username').eq('username', params.username).single()

  if (!player) redirect('/dashboard')

  const { data: bracket } = await supabase
    .from('brackets').select('id, submitted_at').eq('player_id', player.id).single()

  const [{ data: groupPredictions }, { data: knockoutPredictions }, { data: actualResults }] = bracket
    ? await Promise.all([
        supabase.from('group_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('knockout_predictions').select('*').eq('bracket_id', bracket.id),
        supabase.from('actual_results').select('*'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const score = computeScore(groupPredictions ?? [], knockoutPredictions ?? [], actualResults ?? [])

  const backHref = searchParams.from ? `/league/${searchParams.from}` : '/dashboard'
  const tab = (searchParams.tab === 'knockouts' ? 'knockouts' : 'groups') as 'groups' | 'knockouts'

  return (
    <div className="min-h-screen p-5 max-w-6xl mx-auto">

      <div className="anim-fade-up pt-2 mb-7">
        <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-pitch-300 hover:text-[#EBF0FF] transition-colors mb-4 uppercase tracking-wider">
          ← Back
        </Link>
        <p className="section-label mb-1">Player Bracket</p>
        <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">
          {player.username}
        </h1>
        {!bracket?.submitted_at && (
          <p className="mt-2 text-sm font-medium text-gold">
            This player hasn&apos;t submitted their bracket yet.
          </p>
        )}
      </div>

      {bracket && (
        <div>
          <div className="anim-fade-up anim-delay-1 card grid grid-cols-3 mb-6">
            <div className="flex flex-col items-center py-4 border-r border-pitch-600">
              <p className="section-label mb-1">Group Stage</p>
              <span className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">{score.groupPoints}</span>
            </div>
            <div className="flex flex-col items-center py-4 border-r border-pitch-600">
              <p className="section-label mb-1">Knockout</p>
              <span className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">{score.knockoutPoints}</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <p className="section-label mb-1">Total</p>
              <span className="font-display text-4xl tracking-wider text-gold leading-none">{score.total}</span>
            </div>
          </div>

          <div className="anim-fade-up anim-delay-2 flex gap-1.5 mb-6">
            <a
              href={`/player/${params.username}?tab=groups${searchParams.from ? `&from=${searchParams.from}` : ''}`}
              className={`tab-btn ${tab === 'groups' ? 'tab-active' : 'tab-inactive'}`}
            >
              Group Stage
            </a>
            <a
              href={`/player/${params.username}?tab=knockouts${searchParams.from ? `&from=${searchParams.from}` : ''}`}
              className={`tab-btn ${tab === 'knockouts' ? 'tab-active' : 'tab-inactive'}`}
            >
              Knockouts
            </a>
          </div>

          <div className="anim-fade-up anim-delay-3">
            <BracketView
              groupPredictions={groupPredictions ?? []}
              knockoutPredictions={knockoutPredictions ?? []}
              actualResults={actualResults ?? []}
              tab={tab}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run tests again to confirm nothing broken**

```bash
npm test
```

Expected: all tests still pass.

- [ ] **Step 5: Start dev server and verify visually**

```bash
npm run dev
```

Navigate to `/player/<any-username>` in the browser. Verify:
- A card with three columns appears between the player name and the tabs
- Columns show "GROUP STAGE", "KNOCKOUT", "TOTAL" labels
- Numbers render in Bebas Neue display font
- Total number is gold-colored
- Vertical dividers appear between columns
- If the player has a bracket, the scorecard is visible; if no bracket, the scorecard does not appear (the whole bracket section is hidden)

- [ ] **Step 6: Commit**

```bash
git add app/player/[username]/page.tsx
git commit -m "feat: add scorecard card to player bracket page"
```
