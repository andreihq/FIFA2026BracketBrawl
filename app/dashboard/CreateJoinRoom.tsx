'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateJoinRoom() {
  const router = useRouter()
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/room/${data.roomId}`)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: value.toUpperCase() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push(`/room/${data.roomId}`)
  }

  function reset() { setMode('none'); setValue(''); setError('') }

  if (mode === 'none') {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode('create')} className="btn-gold flex-1 py-2.5 text-xs uppercase tracking-widest">
          + Create Room
        </button>
        <button onClick={() => setMode('join')} className="btn-ghost flex-1 py-2.5 text-xs">
          Enter Code
        </button>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          className="field"
          placeholder="Room name"
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
          {loading ? 'Joining…' : 'Join Room'}
        </button>
        <button type="button" onClick={reset} className="btn-ghost px-4 py-2.5 text-xs">Cancel</button>
      </div>
    </form>
  )
}
