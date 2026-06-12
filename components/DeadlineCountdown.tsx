'use client'
import { useState, useEffect } from 'react'

export function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) return null

  const DEADLINE = new Date(deadline)
  const ms = DEADLINE.getTime() - now
  if (ms <= 0) return null

  const totalSecs = Math.floor(ms / 1000)
  const days  = Math.floor(totalSecs / 86400)
  const hours = Math.floor((totalSecs % 86400) / 3600)
  const mins  = Math.floor((totalSecs % 3600) / 60)
  const secs  = totalSecs % 60

  const pad = (n: number) => String(n).padStart(2, '0')

  const deadlineLabel = DEADLINE.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const offsetMins = -new Date().getTimezoneOffset()
  const sign = offsetMins >= 0 ? '+' : '-'
  const absH = Math.floor(Math.abs(offsetMins) / 60)
  const absM = Math.abs(offsetMins) % 60
  const tzLabel = absM ? `UTC${sign}${absH}:${pad(absM)}` : `UTC${sign}${absH}`

  const label = days > 0
    ? `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
    : `${pad(hours)}:${pad(mins)}:${pad(secs)}`

  const chipClass = days === 0
    ? 'text-[#F87171] bg-red-950/30 border-red-700/40'
    : days < 3
      ? 'text-gold bg-gold/8 border-gold/25'
      : 'text-pitch-200 bg-pitch-800 border-pitch-600'

  const dotClass = days === 0
    ? 'bg-[#F87171] animate-pulse'
    : days < 3
      ? 'bg-gold'
      : 'bg-pitch-400'

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
      <span className="text-xs text-[#EBF0FF]">Closes in</span>
      <span className={`font-mono text-xs font-semibold rounded-lg border px-2.5 py-1 tabular-nums ${chipClass}`}>
        {label}
      </span>
      <span className="text-xs text-[#EBF0FF]">{deadlineLabel}</span>
      <span className="text-xs text-pitch-400">{tzLabel}</span>
    </div>
  )
}
