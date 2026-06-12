interface LeaderboardRow {
  username: string
  groupPoints: number
  knockoutPoints: number
  total: number
}

interface Props {
  rows: LeaderboardRow[]
  currentUsername: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export function Leaderboard({ rows, currentUsername }: Props) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-slate-500 border-b border-slate-800 text-xs uppercase">
          <th className="text-left py-2 px-3 font-medium w-8">#</th>
          <th className="text-left py-2 px-3 font-medium">Player</th>
          <th className="text-right py-2 px-3 font-medium" title="Group Stage points">GS</th>
          <th className="text-right py-2 px-3 font-medium" title="Knockout points">KO</th>
          <th className="text-right py-2 px-3 font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.username}
            className={`border-b border-slate-800/50 ${row.username === currentUsername ? 'bg-blue-950/30' : ''}`}
          >
            <td className="py-2.5 px-3 text-slate-400">{MEDALS[i] ?? i + 1}</td>
            <td className="py-2.5 px-3">
              <a href={`/player/${row.username}`} className="text-blue-400 hover:underline">
                {row.username}
              </a>
              {row.username === currentUsername && (
                <span className="ml-2 text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">you</span>
              )}
            </td>
            <td className="py-2.5 px-3 text-right text-slate-300">{row.groupPoints}</td>
            <td className="py-2.5 px-3 text-right text-slate-300">{row.knockoutPoints}</td>
            <td className="py-2.5 px-3 text-right font-semibold text-slate-100">{row.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
