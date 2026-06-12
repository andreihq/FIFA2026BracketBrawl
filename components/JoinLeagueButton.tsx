'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  leagueId: string
  isLoggedIn: boolean
}

export function JoinLeagueButton({ leagueId, isLoggedIn }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn) {
    return (
      <a href={`/login?join=${leagueId}`} className="text-xs uppercase tracking-widest px-4 py-1.5 rounded-lg border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/20 transition-colors">
        Join League
      </a>
    )
  }

  async function handleJoin() {
    setLoading(true)
    await fetch('/api/leagues/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="text-xs uppercase tracking-widest px-4 py-1.5 rounded-lg border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/20 transition-colors"
    >
      {loading ? 'Joining…' : 'Join League'}
    </button>
  )
}
