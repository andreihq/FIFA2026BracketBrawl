'use client'
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
  order: string[]          // team codes in current predicted order (index 0 = 1st)
  onChange: (groupCode: string, newOrder: string[]) => void
  disabled?: boolean
}

const POSITION_STYLES = [
  'border-l-green-500 text-green-400',
  'border-l-blue-500 text-blue-400',
  'border-l-yellow-500 text-yellow-400',
  'border-l-slate-600 text-slate-500 opacity-60',
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
      className={`flex items-center gap-3 rounded bg-slate-800 px-3 py-2 border-l-4 ${POSITION_STYLES[position]} ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="w-5 font-bold text-sm">{position + 1}</span>
      <span className="text-lg">{team?.flag ?? '🏳️'}</span>
      <span className="flex-1 text-sm font-medium text-slate-200">{team?.name ?? teamCode}</span>
      {!disabled && (
        <span
          {...attributes}
          {...listeners}
          className="text-slate-500 cursor-grab select-none"
          aria-label="drag handle"
        >⠿</span>
      )}
    </div>
  )
}

export function GroupStageEditor({ groupCode, order, onChange, disabled = false }: Props) {
  const sensors = useSensors(useSensor(PointerSensor))
  const teams = order.length > 0 ? order : GROUPS[groupCode] ?? []

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = teams.indexOf(active.id as string)
    const newIndex = teams.indexOf(over.id as string)
    onChange(groupCode, arrayMove(teams, oldIndex, newIndex))
  }

  return (
    <div className="rounded-lg bg-slate-900 p-3">
      <div className="text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wide">
        Group {groupCode}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teams} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {teams.map((code, i) => (
              <SortableTeam key={code} teamCode={code} position={i} disabled={disabled} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
