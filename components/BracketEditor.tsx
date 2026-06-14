'use client'
import { useState } from 'react'
import { GROUP_CODES } from '@/data/groups'
import { buildPicks, buildQualifiers } from '@/data/bracket'
import { GroupStageEditor } from './GroupStageEditor'
import { KnockoutBracket } from './KnockoutBracket'

type Tab = 'groups' | 'knockouts'

interface Props {
  groupRankings: Record<string, string[]>
  advancingThirds: Set<string>
  winners: Record<string, string>
  onGroupChange: (groupCode: string, order: string[]) => void
  onAdvancingThirdsChange: (groupCode: string, val: boolean) => void
  onPick: (matchId: string, winner: string) => void
  disabled?: boolean
  showValidation?: boolean
  submitAttempt?: number
  tab?: Tab
  onTabChange?: (tab: Tab) => void
}

export function BracketEditor({
  groupRankings,
  advancingThirds,
  winners,
  onGroupChange,
  onAdvancingThirdsChange,
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

  const qualifiers = buildQualifiers(groupRankings, advancingThirds)
  const picks = buildPicks(groupRankings, qualifiers, winners)
  const thirdsComplete = advancingThirds.size === 8

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
        <>
          {showValidation && !thirdsComplete && (
            <div className="mb-4 rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm font-medium text-[#F87171]">
              Select exactly 8 third-place teams to advance to Knockout Stage — {advancingThirds.size}/8 selected.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {GROUP_CODES.map(g => (
              <GroupStageEditor
                key={g}
                groupCode={g}
                order={groupRankings[g] ?? []}
                onChange={onGroupChange}
                disabled={disabled}
                advances={advancingThirds.has(g)}
                onAdvancesChange={onAdvancingThirdsChange}
                canAdvance={advancingThirds.size < 8 || advancingThirds.has(g)}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'knockouts' && (
        <div className="-mx-5">
          <KnockoutBracket
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
