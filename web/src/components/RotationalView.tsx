import { useState } from 'react';
import type { Team, Player, Booking } from '../types';

interface RotationalViewProps {
  booking: Booking;
  teams: Team[];
  players: Player[];
}

const RotationalView = ({ booking, teams, players }: RotationalViewProps) => {
  const [currentRound, setCurrentRound] = useState(1);
  
  // In rotational mode, after each round, players rotate between teams
  // This creates a more dynamic and fair playing experience
  const totalRounds = teams.length > 1 ? teams.length - 1 : 1;

  const getTeamPlayers = (teamId: string) => {
    return players.filter(p => p.teamId === teamId);
  };

  // Calculate rotation - each round, players shift to the next team
  const getRotatedTeamForRound = (teamIndex: number, round: number): Team | null => {
    if (teams.length === 0) return null;
    const rotatedIndex = (teamIndex + round - 1) % teams.length;
    return teams[rotatedIndex];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Rotational Mode Info */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Rotational Mode
        </h2>
        <p className="text-[var(--color-text-muted)] mb-4">
          In rotational mode, team compositions change each round. This ensures everyone plays with different teammates throughout the session.
        </p>
        
        <div className="flex items-center gap-4">
          <span className="text-[var(--color-text)]">Current Round:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
              disabled={currentRound <= 1}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] flex items-center justify-center disabled:opacity-50"
            >
              -
            </button>
            <span className="w-12 text-center font-bold text-[var(--color-primary)]">
              {currentRound} / {totalRounds}
            </span>
            <button
              onClick={() => setCurrentRound(Math.min(totalRounds, currentRound + 1))}
              disabled={currentRound >= totalRounds}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] flex items-center justify-center disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Rotation Schedule */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)]">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Rotation Schedule
        </h3>
        
        {teams.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-muted)]">
            No teams created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[var(--color-text-muted)] border-b border-[var(--color-surface-light)]">
                  <th className="pb-3 pr-4">Round</th>
                  {teams.map((team) => (
                    <th key={team.id} className="pb-3 pr-4">
                      {team.teamName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: totalRounds }, (_, roundIndex) => {
                  const round = roundIndex + 1;
                  const isCurrentRound = round === currentRound;
                  
                  return (
                    <tr
                      key={round}
                      className={`border-b border-[var(--color-surface-light)] last:border-0 ${
                        isCurrentRound ? 'bg-[var(--color-primary)]/10' : ''
                      }`}
                    >
                      <td className="py-4 pr-4">
                        <span className={`font-semibold ${
                          isCurrentRound ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                        }`}>
                          Round {round}
                        </span>
                      </td>
                      {teams.map((team, teamIndex) => {
                        const rotatedTeam = getRotatedTeamForRound(teamIndex, round);
                        const teamPlayers = rotatedTeam ? getTeamPlayers(rotatedTeam.id) : [];
                        
                        return (
                          <td key={team.id} className="py-4 pr-4">
                            <div className="space-y-1">
                              {teamPlayers.length === 0 ? (
                                <span className="text-[var(--color-text-muted)] text-sm">
                                  No players
                                </span>
                              ) : (
                                teamPlayers.slice(0, 3).map(player => (
                                  <div key={player.id} className="text-sm text-[var(--color-text)]">
                                    {player.playerName}
                                  </div>
                                ))
                              )}
                              {teamPlayers.length > 3 && (
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  +{teamPlayers.length - 3} more
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Current Round Teams */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team, index) => {
          const teamPlayers = getTeamPlayers(team.id);
          const isFull = teamPlayers.length >= booking.playersPerTeam;
          
          return (
            <div
              key={team.id}
              className={`bg-[var(--color-surface)] rounded-2xl p-6 border ${
                isFull ? 'border-[var(--color-success)]' : 'border-[var(--color-surface-light)]'
              } animate-fade-in stagger-${Math.min(index + 1, 5)}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {team.teamName}
                </h3>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  isFull
                    ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                    : 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]'
                }`}>
                  {teamPlayers.length}/{booking.playersPerTeam}
                </span>
              </div>

              {teamPlayers.length === 0 ? (
                <p className="text-center py-4 text-[var(--color-text-muted)]">
                  No players assigned
                </p>
              ) : (
                <ul className="space-y-2">
                  {teamPlayers.map((player, pIndex) => (
                    <li
                      key={player.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-background)]"
                    >
                      <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold">
                        {pIndex + 1}
                      </span>
                      <span className="text-[var(--color-text)]">{player.playerName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* How Rotation Works */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)]">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          How Rotation Works
        </h3>
        <ul className="space-y-3 text-[var(--color-text-muted)]">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold shrink-0">
              1
            </span>
            <span>Players are initially assigned to teams (manually or randomly)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold shrink-0">
              2
            </span>
            <span>Each round, team compositions shift - players move to different teams</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold shrink-0">
              3
            </span>
            <span>This ensures everyone plays with different teammates throughout the session</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold shrink-0">
              4
            </span>
            <span>Perfect for casual play where fair mixing is more important than competition</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RotationalView;

