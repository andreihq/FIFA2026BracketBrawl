'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const join = searchParams.get('join')
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
    if (join) {
      await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: join }),
      })
      window.location.href = `/league/${join}`
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm anim-fade-up">

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold">
            <span className="font-display text-xl text-pitch-950 leading-none">26</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider text-[#EBF0FF] leading-none">Join the Game</h1>
          <p className="mt-2 text-sm text-pitch-300">Create your predictor account</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="section-label mb-2 block">Username</label>
              <input
                className="field"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                maxLength={20}
                required
              />
              {availability === 'available' && (
                <p className="mt-1.5 text-xs font-medium text-[#34D399]">✓ Available</p>
              )}
              {availability === 'taken' && (
                <p className="mt-1.5 text-xs font-medium text-[#F87171]">✗ Already taken</p>
              )}
              {availability === 'checking' && (
                <p className="mt-1.5 text-xs text-pitch-300">Checking…</p>
              )}
            </div>

            <div>
              <label className="section-label mb-2 block">4-digit PIN</label>
              <input
                className="field font-mono tracking-[0.4em] text-center text-lg"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="· · · ·"
                required
              />
            </div>

            <div>
              <label className="section-label mb-2 block">Confirm PIN</label>
              <input
                className="field font-mono tracking-[0.4em] text-center text-lg"
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="· · · ·"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-[#F87171]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || availability !== 'available'}
              className="btn-gold w-full mt-1 uppercase tracking-widest"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-pitch-300">
          Already have an account?{' '}
          <Link href={`/login${join ? `?join=${join}` : ''}`} className="text-gold hover:text-gold-hover transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
