'use client'
import { useState, useEffect } from 'react'

interface Props {
  username: string
  onClose: () => void
}

export function ShareBracketModal({ username, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/player/${username}`

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-wider text-[#EBF0FF] leading-none">Share Bracket</h2>
          <button
            onClick={onClose}
            className="text-pitch-400 hover:text-[#EBF0FF] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-pitch-300 mb-3 uppercase tracking-widest">Your bracket link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-pitch-800 border border-pitch-600 px-3 py-2.5 font-mono text-xs text-pitch-200 truncate">
            {url}
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors uppercase tracking-widest ${
              copied
                ? 'bg-[#34D399]/15 border-[#34D399]/25 text-[#34D399]'
                : 'btn-ghost'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
