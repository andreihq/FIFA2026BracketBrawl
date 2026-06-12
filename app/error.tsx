'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-xl border border-red-700/40 bg-red-950/30 px-6 py-5 max-w-lg">
        <p className="text-xs uppercase tracking-widest text-[#F87171] font-semibold mb-2">Something went wrong</p>
        <p className="text-sm text-[#EBF0FF]/70 font-mono break-all">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="btn-ghost text-xs uppercase tracking-widest px-5 py-2.5"
      >
        Try again
      </button>
    </div>
  )
}
