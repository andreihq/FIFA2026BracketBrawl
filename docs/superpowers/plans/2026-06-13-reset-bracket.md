# Reset Bracket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Reset Bracket" button to the bracket page that clears all predictions and un-submits the bracket after confirmation.

**Architecture:** Extract a reusable `Modal` shell component from `ShareBracketModal`, add a `DELETE /api/brackets` server route that wipes predictions and clears `submitted_at`, and wire up a confirmation modal + reset button on the bracket page.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase (service role key via server client), Tailwind CSS.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/Modal.tsx` | Reusable modal shell: backdrop, card, Escape key, backdrop-click, close button |
| Modify | `components/ShareBracketModal.tsx` | Refactor to use `Modal` instead of inline shell |
| Modify | `app/api/brackets/route.ts` | Add `DELETE` handler — wipes predictions + clears `submitted_at` |
| Modify | `app/bracket/page.tsx` | Add `showReset` state, confirmation modal, "Reset Bracket" button |

---

## Task 1: Create `Modal` component

**Files:**
- Create: `components/Modal.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'
import { useEffect } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-wider text-[#EBF0FF] leading-none">{title}</h2>
          <button
            onClick={onClose}
            className="text-pitch-400 hover:text-[#EBF0FF] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Modal.tsx
git commit -m "feat: add reusable Modal shell component"
```

---

## Task 2: Refactor `ShareBracketModal` to use `Modal`

**Files:**
- Modify: `components/ShareBracketModal.tsx`

- [ ] **Step 1: Replace the inline modal shell with `Modal`**

Replace the entire file content with:

```tsx
'use client'
import { useState } from 'react'
import { Modal } from './Modal'

interface Props {
  username: string
  onClose: () => void
}

export function ShareBracketModal({ username, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/player/${username}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="Share Bracket" onClose={onClose}>
      <p className="text-xs text-pitch-300 mb-3 uppercase tracking-widest">Your bracket link</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-pitch-800 border border-pitch-600 px-3 py-2.5 font-mono text-xs text-pitch-200 truncate">
          {url}
        </div>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors uppercase tracking-widest ${
            copied
              ? 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]'
              : 'btn-ghost'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify the share modal still renders correctly**

Start the dev server (`npm run dev`) and open the bracket page. Click "Share" — the modal should look identical to before.

- [ ] **Step 3: Commit**

```bash
git add components/ShareBracketModal.tsx
git commit -m "refactor: use Modal component in ShareBracketModal"
```

---

## Task 3: Add `DELETE /api/brackets` route

**Files:**
- Modify: `app/api/brackets/route.ts`

- [ ] **Step 1: Add the `DELETE` handler at the bottom of `app/api/brackets/route.ts`**

Append after the `PUT` export:

```ts
export async function DELETE() {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: deadlineSetting } = await supabase.from('settings').select('value').eq('key', 'deadline').single()
  if (deadlineSetting && new Date() > new Date(deadlineSetting.value)) {
    return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 403 })
  }

  const { data: bracket } = await supabase
    .from('brackets')
    .select('id')
    .eq('player_id', session.playerId)
    .single()

  if (!bracket) return NextResponse.json({ ok: true })

  await Promise.all([
    supabase.from('group_predictions').delete().eq('bracket_id', bracket.id),
    supabase.from('knockout_predictions').delete().eq('bracket_id', bracket.id),
  ])

  await supabase
    .from('brackets')
    .update({ submitted_at: null })
    .eq('id', bracket.id)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Run existing tests to make sure nothing broke**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/api/brackets/route.ts
git commit -m "feat: add DELETE /api/brackets to reset bracket and un-submit"
```

---

## Task 4: Add reset button and confirmation modal to bracket page

**Files:**
- Modify: `app/bracket/page.tsx`

- [ ] **Step 1: Add `Modal` import and `showReset` / `resetting` state**

At the top of the file, add the `Modal` import alongside existing imports:

```ts
import { Modal } from '@/components/Modal'
```

Inside `BracketPage`, add two new state variables after the existing `saving` state:

```ts
const [resetting, setResetting] = useState(false)
const [showReset, setShowReset] = useState(false)
```

- [ ] **Step 2: Add the `resetBracket` handler**

Add after the `saveDraft` callback:

```ts
const resetBracket = useCallback(async () => {
  setResetting(true)
  const res = await fetch('/api/brackets', { method: 'DELETE' })
  if (res.ok) {
    const defaultRankings: Record<string, string[]> = {}
    for (const group of GROUP_CODES) {
      defaultRankings[group] = GROUPS[group] ?? []
    }
    setGroupRankings(defaultRankings)
    setQualifiers({})
    setWinners({})
    setSubmitted(false)
  }
  setResetting(false)
  setShowReset(false)
}, [])
```

- [ ] **Step 3: Add the confirmation modal**

Inside the JSX, right after the `{showShare && ...}` line, add:

```tsx
{showReset && (
  <Modal title="Reset Bracket?" onClose={() => setShowReset(false)}>
    <p className="text-sm text-pitch-200 mb-6">
      This will permanently clear all your picks and un-submit your bracket. You can fill it in again before the deadline.
    </p>
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowReset(false)}
        className="btn-ghost px-4 py-2 text-xs uppercase tracking-widest"
      >
        Cancel
      </button>
      <button
        onClick={resetBracket}
        disabled={resetting}
        className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
      >
        {resetting ? 'Resetting…' : 'Reset Bracket'}
      </button>
    </div>
  </Modal>
)}
```

- [ ] **Step 4: Add the "Reset Bracket" button in the action bar**

In the `!isDisabled` action bar (the `<div className="flex items-center gap-3 mt-10 ...">` block), add the button after the Save button:

```tsx
<button
  onClick={() => setShowReset(true)}
  disabled={saving}
  className="btn-ghost px-5 py-2.5 text-xs uppercase tracking-widest text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-400/50"
>
  Reset Bracket
</button>
```

- [ ] **Step 5: Verify end-to-end in the browser**

- Open the bracket page. Confirm "Reset Bracket" button appears next to "Save Bracket".
- Click "Reset Bracket" — confirm the modal appears with Cancel and Reset Bracket buttons.
- Press Escape or click the backdrop — confirm modal closes without resetting.
- Click "Reset Bracket" in the modal — confirm picks clear, badge reverts to "Not Submitted".
- Also verify the Share modal still works correctly.

- [ ] **Step 6: Commit**

```bash
git add app/bracket/page.tsx
git commit -m "feat: add Reset Bracket button with confirmation modal"
```
