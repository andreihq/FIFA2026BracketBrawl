'use client'
import { useState } from 'react'
import { Modal } from './Modal'

interface Props {
  username: string
  onClose: () => void
}

export function ShareBracketModal({ username, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/player/${username}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="Share Bracket" onClose={onClose}>
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
    </Modal>
  )
}
