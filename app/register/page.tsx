'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (username.length < 2) { setAvailability('idle'); return }
    setAvailability('checking')
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/players/check?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      setAvailability(data.available ? 'available' : 'taken')
    }, 400)
    return () => clearTimeout(timer)
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (availability !== 'available') return
    if (pin !== confirmPin) { setError('PINs do not match'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="your_username"
              maxLength={20}
              required
            />
            {availability === 'available' && <p className="text-xs text-green-400 mt-1">✓ Available</p>}
            {availability === 'taken' && <p className="text-xs text-red-400 mt-1">✗ Taken</p>}
            {availability === 'checking' && <p className="text-xs text-slate-400 mt-1">Checking…</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">4-digit PIN</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 focus:outline-none focus:border-blue-500"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Confirm PIN</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 focus:outline-none focus:border-blue-500"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || availability !== 'available'}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400 text-center">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </main>
  )
}
