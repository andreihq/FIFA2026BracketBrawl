'use client'
import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TEAMS } from '@/data/teams'
import { GROUPS } from '@/data/groups'

interface Props {
  groupCode: string
  order: string[]
  onChange: (groupCode: string, newOrder: string[]) => void
  disabled?: boolean
  correctPositions?: Set<number>
  advances?: boolean
  onAdvancesChange?: (groupCode: string, val: boolean) => void
  canAdvance?: boolean
}

// Left-border accent colors per position
const POSITION_BORDERS = [
  'border-l-[#FFD700]',  // 1st — gold
  'border-l-[#C0C0C0]',  // 2nd — silver
  'border-l-[#CD7F32]',  // 3rd — bronze
  'border-l-[#EF4444]',  // 4th — red (out)
]
const POSITION_TEXT = [
  'text-[#FFD700]',
  'text-[#C0C0C0]',
  'text-[#CD7F32]',
  'text-[#EF4444]',
]

function SortableTeam({ teamCode, position, disabled, correct }: { teamCode: string; position: number; disabled: boolean; correct?: boolean }) {
  const team = TEAMS[teamCode]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: teamCode,
    disabled,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? { ...attributes, ...listeners } : {})}
      className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5
        ${correct ? 'border-l-[#34D399] bg-[#34D399]/10' : `bg-pitch-800 ${POSITION_BORDERS[position]}`}
        ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
        ${!disabled ? 'cursor-grab active:cursor-grabbing select-none hover:bg-pitch-700 transition-colors' : ''}
      `}
    >
      <span className={`w-4 text-xs font-bold font-display leading-none ${POSITION_TEXT[position]}`}>
        {position + 1}
      </span>
      <span className="text-base leading-none">{team?.flag ?? '🏳️'}</span>
      <span className="flex-1 text-sm font-medium text-[#EBF0FF] truncate">{team?.name ?? teamCode}</span>
      {!disabled && <span className="text-pitch-500 text-xs select-none">⠿</span>}
    </div>
  )
}

export function GroupStageEditor({ groupCode, order, onChange, disabled = false, correctPositions, advances, onAdvancesChange, canAdvance = true }: Props) {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tooltipOpen) return
    function handleClick(e: Event) {
      if (!tooltipRef.current?.contains(e.target as Node)) setTooltipOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [tooltipOpen])

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  )
  const allTeams = GROUPS[groupCode] ?? []
  const teams = order.length > 0
    ? [...order, ...allTeams.filter(c => !order.includes(c))]
    : allTeams

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = teams.indexOf(active.id as string)
    const newIndex = teams.indexOf(over.id as string)
    onChange(groupCode, arrayMove(teams, oldIndex, newIndex))
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-display text-lg tracking-wider text-[#EBF0FF] leading-none">Group</span>
        <span className="font-display text-lg tracking-wider text-gold leading-none">{groupCode}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teams} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {teams.map((code, i) => (
              <SortableTeam key={code} teamCode={code} position={i} disabled={disabled} correct={correctPositions?.has(i)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {advances !== undefined && (
        <div className="mt-3 pt-3 border-t border-pitch-700">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#CD7F32]">3rd Place Wildcard</p>
            <div ref={tooltipRef} className="relative">
              <button
                type="button"
                onClick={() => setTooltipOpen(o => !o)}
                className={`w-3.5 h-3.5 rounded-full border text-[9px] flex items-center justify-center leading-none font-bold transition-colors cursor-pointer ${tooltipOpen ? 'border-pitch-300 text-pitch-200' : 'border-pitch-500 text-pitch-400 hover:border-pitch-400 hover:text-pitch-300'}`}
              >?</button>
              {tooltipOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-pitch-700 border border-pitch-600 px-3 py-2.5 text-[11px] text-pitch-200 leading-relaxed z-20 normal-case tracking-normal font-normal shadow-lg">
                  In FIFA 2026, only 8 of the 12 third-place teams advance to the Round of 32. Check this box if you predict this group&apos;s 3rd-place team is one of the 8 that qualify.
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-pitch-600" />
                </div>
              )}
            </div>
          </div>
          <label className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 select-none transition-colors
            ${advances ? 'border-l-[#34D399] bg-[#34D399]/10' : 'border-l-[#CD7F32] bg-pitch-800'}
            ${disabled || (!advances && !canAdvance) ? 'opacity-40 cursor-not-allowed' : advances ? 'cursor-pointer hover:bg-[#34D399]/20' : 'cursor-pointer hover:bg-pitch-700'}
          `}>
            <input
              type="checkbox"
              checked={advances}
              disabled={disabled || (!advances && !canAdvance)}
              onChange={e => onAdvancesChange?.(groupCode, e.target.checked)}
              className={`w-3 h-3 flex-shrink-0 rounded cursor-pointer disabled:cursor-not-allowed ${advances ? 'accent-[#34D399]' : 'accent-[#CD7F32]'}`}
            />
            {teams[2] ? (
              <>
                <span className="text-base leading-none">{TEAMS[teams[2]]?.flag ?? '🏳️'}</span>
                <span className={`flex-1 text-sm font-medium truncate ${advances ? 'text-[#34D399]' : 'text-[#EBF0FF]'}`}>{TEAMS[teams[2]]?.name ?? teams[2]}</span>
              </>
            ) : (
              <span className="flex-1 text-sm italic text-pitch-400">3rd place TBD</span>
            )}
          </label>
        </div>
      )}
    </div>
  )
}
