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
  correctPositions?: Set<number>
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

export function GroupStageEditor({ groupCode, order, onChange, disabled = false, correctPositions }: Props) {
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
              <SortableTeam key={code} teamCode={code} position={i} disabled={disabled} correct={correctPositions?.has(i)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
