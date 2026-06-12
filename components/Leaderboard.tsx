interface LeaderboardRow {
  username: string
  groupPoints: number
  knockoutPoints: number
  total: number
}

interface Props {
  rows: LeaderboardRow[]
  currentUsername: string
  leagueId: string
}

const MEDAL_COLORS = [
  'text-gold bg-gold/10 border border-gold/20',
  'text-[#A0AEC0] bg-[#A0AEC0]/10 border border-[#A0AEC0]/20',
  'text-[#C4834A] bg-[#C4834A]/10 border border-[#C4834A]/20',
]

export function Leaderboard({ rows, currentUsername, leagueId }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3.5rem] text-[10px] uppercase tracking-widest text-pitch-400 border-b border-pitch-600 px-4 py-2.5">
        <div>#</div>
        <div>Player</div>
        <div className="text-right" title="Group Stage points">GS</div>
        <div className="text-right" title="Knockout points">KO</div>
        <div className="text-right">Total</div>
      </div>
      <div>
        {rows.map((row, i) => {
          const isMe = row.username === currentUsername
          return (
            <div
              key={row.username}
              className={`grid grid-cols-[2rem_1fr_3rem_3rem_3.5rem] items-center px-4 py-3.5 border-b border-pitch-800/60 last:border-0 transition-colors
                ${isMe ? 'bg-blue-950/25' : 'hover:bg-pitch-900/50'}
              `}
            >
              <div>
                {i < 3 ? (
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${MEDAL_COLORS[i]}`}>
                    {i + 1}
                  </span>
                ) : (
                  <span className="text-xs text-pitch-400 font-mono">{i + 1}</span>
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <a
                  href={`/player/${row.username}?from=${leagueId}`}
                  className="text-sm font-medium text-[#EBF0FF] hover:text-gold transition-colors truncate"
                >
                  {row.username}
                </a>
                {isMe && (
                  <span className="flex-shrink-0 rounded-md bg-pitch-700 px-1.5 py-0.5 text-[10px] font-medium text-pitch-300">
                    you
                  </span>
                )}
              </div>
              <div className="text-right text-xs text-pitch-200 font-mono">{row.groupPoints}</div>
              <div className="text-right text-xs text-pitch-200 font-mono">{row.knockoutPoints}</div>
              <div className={`text-right text-sm font-bold font-mono ${isMe ? 'text-[#60A5FA]' : 'text-[#EBF0FF]'}`}>
                {row.total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
