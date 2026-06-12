'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateJoinLeague() {
  const router = useRouter()
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/league/${data.leagueId}`)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/leagues/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId: value.toUpperCase() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/league/${data.leagueId}`)
  }

  function reset() { setMode('none'); setValue(''); setError('') }

  if (mode === 'none') {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode('create')} className="btn-gold flex-1 py-2.5 text-xs uppercase tracking-widest">
          + Create League
        </button>
        <button onClick={() => setMode('join')} className="btn-ghost flex-1 py-2.5 text-xs uppercase tracking-widest">
          Join League
        </button>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          className="field"
          placeholder="League name"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="text-xs text-[#F87171]">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-gold flex-1 py-2.5 text-xs uppercase tracking-widest">
            {loading ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={reset} className="btn-ghost px-4 py-2.5 text-xs">Cancel</button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-3">
      <input
        className="field font-mono tracking-widest uppercase text-gold placeholder-pitch-400"
        placeholder="FIFA-XXXX"
        value={value}
        onChange={e => setValue(e.target.value.toUpperCase())}
        maxLength={9}
        autoFocus
        required
      />
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-gold flex-1 py-2.5 text-xs uppercase tracking-widest">
          {loading ? 'Joining…' : 'Join League'}
        </button>
        <button type="button" onClick={reset} className="btn-ghost px-4 py-2.5 text-xs">Cancel</button>
      </div>
    </form>
  )
}
