'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
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
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              placeholder="your_username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">PIN</label>
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400 text-center">
          No account? <Link href="/register" className="text-blue-400 hover:underline">Register</Link>
        </p>
      </div>
    </main>
  )
}
