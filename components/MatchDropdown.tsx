'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownOption {
  value: string
  flag?: string
  teamName?: string
}

interface MatchDropdownProps {
  value: string
  options: DropdownOption[]
  placeholder: string
  onChange: (value: string) => void
  disabled?: boolean
  isError?: boolean
  variant?: 'default' | 'gold' | 'bronze'
}

export function MatchDropdown({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  isError = false,
  variant = 'default',
}: MatchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPanelStyle({ position: 'fixed', top: r.bottom + 2, left: r.left, width: r.width, zIndex: 9999 })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    const close = () => setIsOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    function onMouseDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen])

  const selected = options.find(o => o.value === value)

  const styles = {
    default: {
      filled:  'bg-[#0D1320] border-[#2A3F5A] text-[#EBF0FF]',
      empty:   'bg-[#0D1117] border-[#1E2E43] text-[#6B7FA0]',
      error:   'bg-red-950/30 border-red-700/70 text-[#F87171]',
      hover:   'hover:border-[#3D5A7A] hover:bg-[#131C2E]',
      chevron: { sel: 'text-[#6B7FA0]', unsel: 'text-[#3D4F6E]' },
      optHover:'hover:bg-[#192436]',
      optSel:  'bg-[#F5A623]/12 text-[#F5A623]',
    },
    gold: {
      filled:  'bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]',
      empty:   'bg-[#0D1117] border-[#1E2E43] text-[#6B7FA0]',
      error:   'bg-red-950/30 border-red-700/70 text-[#F87171]',
      hover:   'hover:border-[#F5A623]/30 hover:bg-[#F5A623]/5',
      chevron: { sel: 'text-[#F5A623]', unsel: 'text-[#3D4F6E]' },
      optHover:'hover:bg-[#F5A623]/8',
      optSel:  'bg-[#F5A623]/15 text-[#F5A623]',
    },
    bronze: {
      filled:  'bg-[#3d2810]/40 border-[#C4834A]/40 text-[#C4834A]',
      empty:   'bg-[#0D1117] border-[#1E2E43] text-[#6B7FA0]',
      error:   'bg-red-950/30 border-red-700/70 text-[#F87171]',
      hover:   'hover:border-[#C4834A]/30 hover:bg-[#3d2810]/20',
      chevron: { sel: 'text-[#C4834A]', unsel: 'text-[#3D4F6E]' },
      optHover:'hover:bg-[#3d2810]/30',
      optSel:  'bg-[#3d2810]/40 text-[#C4834A]',
    },
  }[variant]

  const triggerClass = disabled
    ? (selected ? styles.filled : styles.empty)
    : isError
      ? styles.error
      : selected
        ? styles.filled
        : styles.empty

  const chevronClass = isError
    ? 'text-red-500/70'
    : selected
      ? styles.chevron.sel
      : styles.chevron.unsel

  const isInteractable = !disabled && options.length > 0

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => isInteractable && setIsOpen(v => !v)}
        disabled={!isInteractable}
        className={[
          'w-full flex items-center justify-between gap-1 rounded-lg px-2.5 py-1.5 text-sm',
          'border transition-all duration-150 outline-none text-left select-none',
          triggerClass,
          isInteractable ? styles.hover : '',
          !isInteractable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          isOpen ? 'ring-1 ring-[#F5A623]/25 border-[#F5A623]/35 shadow-[0_0_12px_rgba(245,166,35,0.08)]' : '',
        ].join(' ')}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          {selected ? (
            <>
              {selected.flag && <span className="flex-shrink-0 leading-none">{selected.flag}</span>}
              <span className="truncate font-medium">{selected.teamName ?? selected.value}</span>
            </>
          ) : (
            <span className="truncate italic opacity-70">{placeholder}</span>
          )}
        </span>

        {/* Chevron — always shown when component is rendered (bracket is editable) */}
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={[
            'flex-shrink-0 w-3 h-3 transition-transform duration-200',
            chevronClass,
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {isOpen && mounted && createPortal(
        <div
          ref={panelRef}
          style={{
            ...panelStyle,
            animation: 'matchDropdownOpen 0.14s cubic-bezier(0.16,1,0.3,1) both',
          }}
          className="rounded-lg border border-[#2A3F5A] bg-[#0F1826] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false) }}
              className={[
                'w-full flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-left transition-colors duration-100',
                opt.value === value ? styles.optSel : `text-[#EBF0FF] ${styles.optHover}`,
                i > 0 ? 'border-t border-[#1A2840]' : '',
              ].join(' ')}
            >
              {opt.flag && <span className="flex-shrink-0 leading-none">{opt.flag}</span>}
              <span className="truncate font-medium">{opt.teamName ?? opt.value}</span>
              {opt.value === value && (
                <svg viewBox="0 0 16 16" fill="currentColor" className="ml-auto flex-shrink-0 w-3 h-3 opacity-80">
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
