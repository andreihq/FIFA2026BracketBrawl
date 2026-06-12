'use client'
import { useState } from 'react'
import { GROUP_CODES, GROUPS } from '@/data/groups'
import { KNOCKOUT_MATCHES } from '@/data/bracket'
import { GroupStageEditor } from '@/components/GroupStageEditor'
import { KnockoutBracket } from '@/components/KnockoutBracket'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeSection, setActiveSection] = useState<'groups' | 'knockout' | 'settings'>('groups')
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>({})
  const [koPicks, setKoPicks] = useState<Record<string, string>>({})
  const [thirdPicks, setThirdPicks] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')

  async function checkPassword(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/results', {
      headers: { 'x-admin-password': password },
    })
    if (res.status === 401) { setAuthError('Wrong password'); return }

    const { results } = await res.json()
    const rankings: Record<string, string[]> = {}
    for (const group of GROUP_CODES) {
      const rows = (results as any[]).filter(r => r.result_type === 'group' && r.ref_id === group)
      if (rows.length > 0) {
        const arr: string[] = []
        for (const r of rows) arr[r.position - 1] = r.team_code
        rankings[group] = arr.filter(Boolean)
      } else {
        rankings[group] = GROUPS[group] ?? []
      }
    }
    setGroupRankings(rankings)

    const ko: Record<string, string> = {}
    const third: Record<string, string> = {}
    for (const r of (results as any[]).filter((r: any) => r.result_type === 'knockout')) {
      if (r.ref_id.endsWith(':3rd')) {
        third[r.ref_id.slice(0, -4)] = r.team_code
      } else {
        ko[r.ref_id] = r.team_code
      }
    }
    setKoPicks(ko)
    setThirdPicks(third)
    setAuthed(true)
  }

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
    const posts = [
      ...Object.entries(koPicks).map(([ref_id, team_code]) =>
        fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ result_type: 'knockout', ref_id, entries: [{ team_code }] }),
        })
      ),
      ...Object.entries(thirdPicks).map(([matchId, team_code]) =>
        fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ result_type: 'knockout', ref_id: `${matchId}:3rd`, entries: [{ team_code }] }),
        })
      ),
    ]
    await Promise.all(posts)
    setMsg('Knockout results saved ✓')
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

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-xs anim-fade-up">
          <div className="mb-6 text-center">
            <h1 className="font-display text-4xl tracking-wider text-[#EBF0FF]">Admin</h1>
            <p className="text-sm text-pitch-300 mt-1">Enter results</p>
          </div>
          <form onSubmit={checkPassword} className="card p-6 flex flex-col gap-4">
            <input
              type="password"
              className="field"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {authError && <p className="text-sm text-[#F87171]">{authError}</p>}
            <button type="submit" className="btn-gold w-full uppercase tracking-widest text-xs">
              Enter
            </button>
          </form>
        </div>
      </main>
    )
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
        {(['groups', 'knockout', 'settings'] as const).map(s => (
          <button key={s} onClick={() => { setMsg(''); setActiveSection(s) }}
            className={`tab-btn ${activeSection === s ? 'tab-active' : 'tab-inactive'}`}>
            {s === 'groups' ? 'Group Stage' : s === 'knockout' ? 'Knockout' : 'Settings'}
          </button>
        ))}
      </div>

      {activeSection === 'groups' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {GROUP_CODES.map(g => (
              <GroupStageEditor
                key={g}
                groupCode={g}
                order={groupRankings[g] ?? []}
                onChange={(code, order) => setGroupRankings(prev => ({ ...prev, [code]: order }))}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-pitch-700">
            <button onClick={saveGroups} disabled={saving} className="btn-gold px-5 py-2.5 text-xs uppercase tracking-widest">
              {saving ? 'Saving…' : 'Save Group Results'}
            </button>
          </div>
        </>
      )}

      {activeSection === 'knockout' && (
        <>
          <KnockoutBracket
            groupRankings={groupRankings}
            picks={koPicks}
            onPick={(matchId, teamCode) => setKoPicks(prev => ({ ...prev, [matchId]: teamCode }))}
            thirdPicks={thirdPicks}
            onThirdPick={(matchId, teamCode) => {
              if (!teamCode) {
                setThirdPicks(prev => { const n = { ...prev }; delete n[matchId]; return n })
              } else {
                setThirdPicks(prev => ({ ...prev, [matchId]: teamCode }))
              }
            }}
          />
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-pitch-700">
            <button onClick={saveKnockout} disabled={saving} className="btn-gold px-5 py-2.5 text-xs uppercase tracking-widest">
              {saving ? 'Saving…' : 'Save Knockout Results'}
            </button>
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
