'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { randomUsernamePlaceholder } from '@/lib/username-suggestions'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const join = searchParams.get('join')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernamePlaceholder, setUsernamePlaceholder] = useState('')
  useEffect(() => { setUsernamePlaceholder(randomUsernamePlaceholder()) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
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
    <main className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden p-6 pt-14 sm:pt-20 md:pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-600/8 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/6 blur-[80px]" />
      </div>
      <div className="relative z-10 w-full max-w-sm anim-fade-up">

        <div className="mb-8 text-center">
          <img src="/trophy.png" alt="FIFA World Cup trophy" className="mb-4 w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] md:w-[140px] md:h-[140px] object-contain mx-auto" />
          <h1 className="font-display text-5xl tracking-wider text-[#EBF0FF] leading-none">Welcome back</h1>
          <p className="mt-2 text-sm text-pitch-300">Sign in to your predictor account</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="section-label mb-2 block">Username</label>
              <input
                className="field"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder={usernamePlaceholder}
                required
              />
            </div>
            <div>
              <label className="section-label mb-2 block">Password</label>
              <input
                className="field"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 4 characters"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-[#F87171]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full mt-1 uppercase tracking-widest">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-pitch-300">
          No account?{' '}
          <Link href={`/register${join ? `?join=${join}` : ''}`} className="text-gold hover:text-gold-hover transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
