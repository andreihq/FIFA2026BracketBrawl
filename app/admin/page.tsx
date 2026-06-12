'use client'
import { useState } from 'react'
import { GROUPS, GROUP_CODES } from '@/data/groups'
import { KNOCKOUT_MATCHES } from '@/data/bracket'
import { TEAMS } from '@/data/teams'

const KO_ROUNDS = ['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'] as const

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeSection, setActiveSection] = useState<'groups' | 'knockout'>('groups')
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [selectedRound, setSelectedRound] = useState('R32')
  const [groupResults, setGroupResults] = useState<Record<string, Record<number, string>>>({})
  const [koResults, setKoResults] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function checkPassword(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ result_type: 'group', ref_id: '__ping__', entries: [] }),
    })
    if (res.status === 401) { setAuthError('Wrong password'); return }
    setAuthed(true)
  }

  async function saveGroupResult() {
    setSaving(true); setMsg('')
    const pos = groupResults[selectedGroup] ?? {}
    const entries = Object.entries(pos).map(([p, tc]) => ({ team_code: tc, position: Number(p) }))
    const res = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ result_type: 'group', ref_id: selectedGroup, entries }),
    })
    setMsg(res.ok ? `Group ${selectedGroup} saved ✓` : 'Error saving')
    setSaving(false)
  }

  async function saveKoResult(matchId: string) {
    const winner = koResults[matchId]
    if (!winner) return
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ result_type: 'knockout', ref_id: matchId, entries: [{ team_code: winner }] }),
    })
    setMsg(res.ok ? `${matchId} saved ✓` : 'Error saving')
    setSaving(false)
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <form onSubmit={checkPassword} className="flex flex-col gap-4 w-full max-w-xs">
          <h1 className="text-xl font-bold">Admin</h1>
          <input
            type="password"
            className="rounded bg-slate-800 border border-slate-600 px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {authError && <p className="text-sm text-red-400">{authError}</p>}
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">
            Enter
          </button>
        </form>
      </main>
    )
  }

  const roundMatches = KNOCKOUT_MATCHES.filter(m => m.round === selectedRound)

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin — Enter Results</h1>
      {msg && <p className="mb-4 text-sm text-green-400">{msg}</p>}

      <div className="flex gap-2 mb-6">
        {(['groups', 'knockout'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded text-sm font-medium ${activeSection === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {s === 'groups' ? 'Group Stage' : 'Knockout'}
          </button>
        ))}
      </div>

      {activeSection === 'groups' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {GROUP_CODES.map(g => (
              <button key={g} onClick={() => setSelectedGroup(g)}
                className={`px-3 py-1 rounded text-sm ${selectedGroup === g ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {[1, 2, 3].map(pos => (
              <div key={pos} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-slate-400">{pos}</span>
                <select
                  className="flex-1 rounded bg-slate-800 border border-slate-600 px-3 py-2 text-sm"
                  value={groupResults[selectedGroup]?.[pos] ?? ''}
                  onChange={e => setGroupResults(prev => ({
                    ...prev,
                    [selectedGroup]: { ...(prev[selectedGroup] ?? {}), [pos]: e.target.value }
                  }))}
                >
                  <option value="">— select team —</option>
                  {GROUPS[selectedGroup]?.map(tc => (
                    <option key={tc} value={tc}>{TEAMS[tc]?.flag} {TEAMS[tc]?.name ?? tc}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button onClick={saveGroupResult} disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
            {saving ? 'Saving…' : `Save Group ${selectedGroup}`}
          </button>
        </div>
      )}

      {activeSection === 'knockout' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {KO_ROUNDS.map(r => (
              <button key={r} onClick={() => setSelectedRound(r)}
                className={`px-3 py-1 rounded text-sm ${selectedRound === r ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {roundMatches.map(match => (
              <div key={match.id} className="flex flex-col gap-1 bg-slate-800 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">{match.id}</span>
                  <span className="text-xs text-slate-400">{match.slotA} vs {match.slotB}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded bg-slate-700 border border-slate-600 px-2 py-1 text-sm font-mono uppercase"
                    placeholder="Winner team code (e.g. BRA)"
                    value={koResults[match.id] ?? ''}
                    onChange={e => setKoResults(prev => ({ ...prev, [match.id]: e.target.value.toUpperCase().slice(0, 4) }))}
                    maxLength={4}
                  />
                  <button onClick={() => saveKoResult(match.id)} disabled={saving || !koResults[match.id]}
                    className="rounded bg-blue-600 px-3 py-1 text-xs hover:bg-blue-500 disabled:opacity-40">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
