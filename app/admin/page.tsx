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

  const roundMatches = KNOCKOUT_MATCHES.filter(m => m.round === selectedRound)

  return (
    <div className="min-h-screen p-5 max-w-2xl mx-auto">
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
        {(['groups', 'knockout'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`tab-btn ${activeSection === s ? 'tab-active' : 'tab-inactive'}`}>
            {s === 'groups' ? 'Group Stage' : 'Knockout'}
          </button>
        ))}
      </div>

      {activeSection === 'groups' && (
        <div className="card p-5">
          <div className="flex gap-1.5 flex-wrap mb-5">
            {GROUP_CODES.map(g => (
              <button key={g} onClick={() => setSelectedGroup(g)}
                className={`tab-btn py-1.5 px-3 text-xs ${selectedGroup === g ? 'tab-active' : 'tab-inactive'}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 mb-5">
            {[1, 2, 3].map(pos => (
              <div key={pos} className="flex items-center gap-3">
                <span className="font-display text-base text-pitch-300 w-5 text-center leading-none">{pos}</span>
                <select
                  className="field flex-1 py-2"
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
            className="btn-gold uppercase tracking-widest text-xs">
            {saving ? 'Saving…' : `Save Group ${selectedGroup}`}
          </button>
        </div>
      )}

      {activeSection === 'knockout' && (
        <div className="card p-5">
          <div className="flex gap-1.5 flex-wrap mb-5">
            {KO_ROUNDS.map(r => (
              <button key={r} onClick={() => setSelectedRound(r)}
                className={`tab-btn py-1.5 px-3 text-xs font-mono ${selectedRound === r ? 'tab-active' : 'tab-inactive'}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {roundMatches.map(match => (
              <div key={match.id} className="rounded-xl bg-pitch-800 border border-pitch-600 px-3 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] text-pitch-400 bg-pitch-900 px-1.5 py-0.5 rounded">{match.id}</span>
                  <span className="text-xs text-pitch-300 truncate">{match.slotA} vs {match.slotB}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="field flex-1 py-2 font-mono uppercase text-sm"
                    placeholder="Team code (e.g. BRA)"
                    value={koResults[match.id] ?? ''}
                    onChange={e => setKoResults(prev => ({ ...prev, [match.id]: e.target.value.toUpperCase().slice(0, 4) }))}
                    maxLength={4}
                  />
                  <button onClick={() => saveKoResult(match.id)} disabled={saving || !koResults[match.id]}
                    className="btn-gold px-3 py-2 text-xs">
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
