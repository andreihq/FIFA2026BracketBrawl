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

  return (
    <div className="flex flex-col gap-2">
      {mode === 'none' && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('create')}
            className="flex-1 rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500"
          >
            + Create room
          </button>
          <button
            onClick={() => setMode('join')}
            className="flex-1 rounded bg-slate-700 px-4 py-2.5 text-sm hover:bg-slate-600"
          >
            Enter room code
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            className="w-full rounded bg-slate-800 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Room name"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => { setMode('none'); setValue(''); setError('') }} className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">Cancel</button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            className="w-full rounded bg-slate-800 border border-slate-600 px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 uppercase"
            placeholder="FIFA-XXXX"
            value={value}
            onChange={e => setValue(e.target.value.toUpperCase())}
            maxLength={9}
            autoFocus
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
              {loading ? 'Joining…' : 'Join'}
            </button>
            <button type="button" onClick={() => { setMode('none'); setValue(''); setError('') }} className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
