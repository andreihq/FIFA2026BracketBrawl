'use client'
import { useEffect } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
          <h2 className="font-display text-2xl tracking-wider text-[#EBF0FF] leading-none">{title}</h2>
          <button
            onClick={onClose}
            className="text-pitch-400 hover:text-[#EBF0FF] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
