import type { LeagueStanding } from '../types';

interface LeagueTableProps {
  standings: LeagueStanding[];
}

const LeagueTable = ({ standings }: LeagueTableProps) => {
  if (standings.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          League Table
        </h2>
        <div className="text-center py-8 text-[var(--color-text-muted)]">
          <div className="text-3xl mb-2">📊</div>
          <p>No standings yet. Matches need to be played first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        League Table
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-[var(--color-text-muted)] border-b border-[var(--color-surface-light)]">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Team</th>
              <th className="pb-3 pr-4 text-center">P</th>
              <th className="pb-3 pr-4 text-center">W</th>
              <th className="pb-3 pr-4 text-center">D</th>
              <th className="pb-3 pr-4 text-center">L</th>
              <th className="pb-3 pr-4 text-center">GF</th>
              <th className="pb-3 pr-4 text-center">GA</th>
              <th className="pb-3 pr-4 text-center">GD</th>
              <th className="pb-3 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr
                key={standing.teamId}
                className={`border-b border-[var(--color-surface-light)] last:border-0 ${
                  index === 0 ? 'bg-[var(--color-success)]/5' : ''
                }`}
              >
                <td className="py-3 pr-4">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    index === 0
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[var(--color-text)] font-medium">
                    {standing.teamName}
                  </span>
                </td>
                <td className="py-3 pr-4 text-center text-[var(--color-text-muted)]">
                  {standing.played}
                </td>
                <td className="py-3 pr-4 text-center text-[var(--color-success)]">
                  {standing.won}
                </td>
                <td className="py-3 pr-4 text-center text-[var(--color-text-muted)]">
                  {standing.drawn}
                </td>
                <td className="py-3 pr-4 text-center text-[var(--color-error)]">
                  {standing.lost}
                </td>
                <td className="py-3 pr-4 text-center text-[var(--color-text-muted)]">
                  {standing.goalsFor}
                </td>
                <td className="py-3 pr-4 text-center text-[var(--color-text-muted)]">
                  {standing.goalsAgainst}
                </td>
                <td className="py-3 pr-4 text-center">
                  <span className={
                    standing.goalDifference > 0
                      ? 'text-[var(--color-success)]'
                      : standing.goalDifference < 0
                      ? 'text-[var(--color-error)]'
                      : 'text-[var(--color-text-muted)]'
                  }>
                    {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className="font-bold text-[var(--color-text)]">
                    {standing.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--color-surface-light)] text-xs text-[var(--color-text-muted)]">
        <p>P = Played, W = Won, D = Drawn, L = Lost, GF = Goals For, GA = Goals Against, GD = Goal Difference, Pts = Points</p>
      </div>
    </div>
  );
};

export default LeagueTable;

