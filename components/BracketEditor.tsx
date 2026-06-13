'use client'
import { useState } from 'react'
import { GROUP_CODES } from '@/data/groups'
import { buildPicks } from '@/data/bracket'
import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'

type Tab = 'groups' | 'knockouts'

interface Props {
  groupRankings: Record<string, string[]>
  qualifiers: Record<string, string>
  winners: Record<string, string>
  onGroupChange: (groupCode: string, order: string[]) => void
  onPick: (matchId: string, field: 'teamB' | 'winner', teamCode: string) => void
  disabled?: boolean
  showValidation?: boolean
  submitAttempt?: number
  tab?: Tab
  onTabChange?: (tab: Tab) => void
}

export function BracketEditor({
  groupRankings,
  qualifiers,
  winners,
  onGroupChange,
  onPick,
  disabled = false,
  showValidation = false,
  submitAttempt = 0,
  tab: controlledTab,
  onTabChange,
}: Props) {
  const [internalTab, setInternalTab] = useState<Tab>('groups')
  const tab = controlledTab ?? internalTab

  function switchTab(t: Tab) {
    setInternalTab(t)
    onTabChange?.(t)
  }

  const picks = buildPicks(groupRankings, qualifiers, winners)

  return (
    <>
      <div className="flex gap-1.5 mb-6">
        {(['groups', 'knockouts'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`tab-btn ${tab === t ? 'tab-active' : 'tab-inactive'}`}
          >
            {t === 'groups' ? 'Group Stage' : 'Knockouts'}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GROUP_CODES.map(g => (
            <GroupStageEditor
              key={g}
              groupCode={g}
              order={groupRankings[g] ?? []}
              onChange={onGroupChange}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {tab === 'knockouts' && (
        <div className="-mx-5">
          <KnockoutBracket
            groupRankings={groupRankings}
            picks={picks}
            onPick={onPick}
            disabled={disabled}
            showValidation={showValidation}
            submitAttempt={submitAttempt}
          />
        </div>
      )}
    </>
  )
}
