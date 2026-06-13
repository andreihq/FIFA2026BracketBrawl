'use client'
import { useState } from 'react'
import { GROUP_CODES, GROUPS } from '@/data/groups'
import { BracketEditor } from '@/components/BracketEditor'
import type { ActualResult } from '@/types'

// ── Login gate ────────────────────────────────────────────────────────────────
// Kept as a separate component so it fully unmounts (and its password input
// disappears from the DOM) the moment the user authenticates.

function AdminLogin({ onSuccess }: { onSuccess: (password: string, initialData: { results: ActualResult[] }) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/results', {
      headers: { 'x-admin-password': password },
    })
    if (res.status === 401) { setError('Wrong password'); return }
    const data = await res.json()
    onSuccess(password, data)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-xs anim-fade-up">
        <div className="mb-6 text-center">
          <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF]">Admin</h1>
          <p className="text-sm text-pitch-300 mt-1">Enter results</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4" autoComplete="off">
          <input
            type="password"
            className="field"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="off"
            data-1p-ignore
            required
          />
          {error && <p className="text-sm text-[#F87171]">{error}</p>}
          <button type="submit" className="btn-gold w-full uppercase tracking-widest text-xs">
            Enter
          </button>
        </form>
      </div>
    </main>
  )
}

// ── Admin panel ───────────────────────────────────────────────────────────────

function AdminPanel({ password, initialResults }: { password: string; initialResults: ActualResult[] }) {
  const [activeSection, setActiveSection] = useState<'bracket' | 'settings'>('bracket')
  const [bracketTab, setBracketTab] = useState<'groups' | 'knockouts'>('groups')
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>(() => {
    const rankings: Record<string, string[]> = {}
    for (const group of GROUP_CODES) {
      const rows = initialResults.filter(r => r.result_type === 'group' && r.ref_id === group)
      if (rows.length > 0) {
        const arr: string[] = []
        for (const r of rows) if (r.position != null) arr[r.position - 1] = r.team_code
        rankings[group] = arr.filter(Boolean)
      } else {
        rankings[group] = GROUPS[group] ?? []
      }
    }
    return rankings
  })
  const [qualifiers, setQualifiers] = useState<Record<string, string>>(() => {
    const q: Record<string, string> = {}
    for (const r of initialResults.filter(r => r.result_type === 'knockout' && r.ref_id.endsWith(':qualifier')))
      q[r.ref_id.replace(':qualifier', '')] = r.team_code
    return q
  })
  const [winners, setWinners] = useState<Record<string, string>>(() => {
    const w: Record<string, string> = {}
    for (const r of initialResults.filter(r => r.result_type === 'knockout' && !r.ref_id.endsWith(':qualifier')))
      w[r.ref_id] = r.team_code
    return w
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')

  async function saveGroups() {
    setSaving(true); setMsg('')
    await Promise.all(GROUP_CODES.map(group => {
      const order = groupRankings[group] ?? []
      const entries = order.map((team_code, i) => ({ team_code, position: i + 1 }))
      return fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ result_type: 'group', ref_id: group, entries }),
      })
    }))
    setMsg('Group results saved ✓')
    setSaving(false)
  }

  async function saveKnockout() {
    setSaving(true); setMsg('')
    const entries = [
      ...Object.entries(winners).map(([ref_id, team_code]) => ({ ref_id, team_code })),
      ...Object.entries(qualifiers).map(([ref_id, team_code]) => ({ ref_id: ref_id + ':qualifier', team_code })),
    ]
    await Promise.all(
      entries.map(({ ref_id, team_code }) =>
        fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ result_type: 'knockout', ref_id, entries: [{ team_code }] }),
        })
      )
    )
    setMsg('Knockout results saved ✓')
    setSaving(false)
  }

  async function resetGroups() {
    if (!confirm('Reset all group results? This cannot be undone.')) return
    setSaving(true); setMsg('')
    await fetch('/api/admin/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ result_type: 'group' }),
    })
    const fresh: Record<string, string[]> = {}
    for (const group of GROUP_CODES) fresh[group] = GROUPS[group] ?? []
    setGroupRankings(fresh)
    setMsg('Group results reset ✓')
    setSaving(false)
  }

  async function resetKnockout() {
    if (!confirm('Reset all knockout results? This cannot be undone.')) return
    setSaving(true); setMsg('')
    await fetch('/api/admin/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ result_type: 'knockout' }),
    })
    setWinners({})
    setQualifiers({})
    setMsg('Knockout results reset ✓')
    setSaving(false)
  }

  async function saveDeadline(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ deadline: deadlineInput }),
    })
    setMsg(res.ok ? 'Deadline saved ✓' : 'Error saving deadline')
    setSaving(false)
  }

  return (
    <div className="min-h-screen p-5 max-w-6xl mx-auto">
      <div className="anim-fade-up pt-2 mb-7">
        <p className="section-label mb-1">Admin Panel</p>
        <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF] leading-none">Enter Results</h1>
      </div>

      {msg && (
        <div className="mb-5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 px-4 py-2.5 text-sm font-medium text-[#34D399]">
          {msg}
        </div>
      )}

      <div className="flex gap-1.5 mb-6">
        {(['bracket', 'settings'] as const).map(s => (
          <button key={s} onClick={() => { setMsg(''); setActiveSection(s) }}
            className={`tab-btn ${activeSection === s ? 'tab-active' : 'tab-inactive'}`}>
            {s === 'bracket' ? 'Results' : 'Settings'}
          </button>
        ))}
      </div>

      {activeSection === 'bracket' && (
        <>
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
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-pitch-700">
            {bracketTab === 'groups' ? (
              <>
                <button onClick={resetGroups} disabled={saving} className="px-5 py-2.5 text-xs uppercase tracking-widest rounded-xl border border-[#F87171]/40 text-[#F87171] hover:bg-[#F87171]/10 transition-colors disabled:opacity-40">
                  Reset Groups
                </button>
                <button onClick={saveGroups} disabled={saving} className="btn-gold px-5 py-2.5 text-xs uppercase tracking-widest">
                  {saving ? 'Saving…' : 'Save Group Results'}
                </button>
              </>
            ) : (
              <>
                <button onClick={resetKnockout} disabled={saving} className="px-5 py-2.5 text-xs uppercase tracking-widest rounded-xl border border-[#F87171]/40 text-[#F87171] hover:bg-[#F87171]/10 transition-colors disabled:opacity-40">
                  Reset Knockouts
                </button>
                <button onClick={saveKnockout} disabled={saving} className="btn-gold px-5 py-2.5 text-xs uppercase tracking-widest">
                  {saving ? 'Saving…' : 'Save Knockout Results'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {activeSection === 'settings' && (
        <div className="card p-5 max-w-sm">
          <p className="text-sm font-medium text-[#EBF0FF] mb-4">Submission Deadline</p>
          <form onSubmit={saveDeadline} className="flex flex-col gap-3">
            <input
              type="datetime-local"
              className="field"
              value={deadlineInput}
              onChange={e => setDeadlineInput(e.target.value)}
              required
            />
            <p className="text-xs text-pitch-400">Enter the deadline in your local time. It will be stored as UTC.</p>
            <button type="submit" disabled={saving} className="btn-gold uppercase tracking-widest text-xs">
              {saving ? 'Saving…' : 'Save Deadline'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [session, setSession] = useState<{ password: string; results: ActualResult[] } | null>(null)

  if (!session) {
    return (
      <AdminLogin
        onSuccess={(password, data) => setSession({ password, results: data.results })}
      />
    )
  }

  return <AdminPanel password={session.password} initialResults={session.results} />
}
