'use client'
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
}

// Left-border accent colors per position
const POSITION_BORDERS = [
  'border-l-[#34D399]',  // 1st — green (advances)
  'border-l-[#60A5FA]',  // 2nd — blue (advances)
  'border-l-[#F5A623]',  // 3rd — gold (maybe)
  'border-l-pitch-500',  // 4th — grey (out)
]
const POSITION_TEXT = [
  'text-[#34D399]',
  'text-[#60A5FA]',
  'text-gold',
  'text-pitch-400',
]

function SortableTeam({ teamCode, position, disabled }: { teamCode: string; position: number; disabled: boolean }) {
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
      className={`flex items-center gap-3 rounded-xl border-l-[3px] bg-pitch-800 px-3 py-2.5
        ${POSITION_BORDERS[position]}
        ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
        ${!disabled ? 'cursor-grab active:cursor-grabbing select-none hover:bg-pitch-700 transition-colors' : ''}
      `}
    >
      <span className={`w-4 text-xs font-bold font-display leading-none ${POSITION_TEXT[position]}`}>
        {position + 1}
      </span>
      <span className="text-base leading-none">{team?.flag ?? '🏳️'}</span>
      <span className="flex-1 text-xs font-medium text-[#EBF0FF] truncate">{team?.name ?? teamCode}</span>
      {!disabled && <span className="text-pitch-500 text-xs select-none">⠿</span>}
    </div>
  )
}

export function GroupStageEditor({ groupCode, order, onChange, disabled = false }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
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
              <SortableTeam key={code} teamCode={code} position={i} disabled={disabled} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
