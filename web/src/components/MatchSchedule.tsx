import { useState } from 'react';
import type { Match, Team } from '../types';

interface MatchScheduleProps {
  matches: Match[];
  teams: Team[];
  isAdmin: boolean;
  onUpdateResult: (matchId: string, team1Score: number, team2Score: number) => void;
}

const MatchSchedule = ({
  matches,
  teams,
  isAdmin,
  onUpdateResult
}: MatchScheduleProps) => {
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.teamName || 'Unknown';
  };

  const handleSaveResult = (matchId: string) => {
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    
    if (!isNaN(s1) && !isNaN(s2) && s1 >= 0 && s2 >= 0) {
      onUpdateResult(matchId, s1, s2);
      setEditingMatch(null);
      setScore1('');
      setScore2('');
    }
  };

  const startEditing = (match: Match) => {
    setEditingMatch(match.id);
    setScore1(match.team1Score?.toString() || '');
    setScore2(match.team2Score?.toString() || '');
  };

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  if (matches.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Match Schedule
        </h2>
        <div className="text-center py-8 text-[var(--color-text-muted)]">
          <div className="text-3xl mb-2">📋</div>
          <p>No matches scheduled yet.</p>
          {isAdmin && <p className="text-sm mt-2">Generate matches from the Teams tab.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Match Schedule
      </h2>

      <div className="space-y-6">
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round}>
            <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
              Round {round}
            </h3>
            <div className="space-y-3">
              {roundMatches.map((match, index) => (
                <div
                  key={match.id}
                  className={`p-4 rounded-xl bg-[var(--color-background)] animate-slide-in stagger-${Math.min(index + 1, 5)}`}
                >
                  {editingMatch === match.id ? (
                    <div className="flex items-center gap-3">
                      <span className="flex-1 text-right text-[var(--color-text)] font-medium truncate">
                        {getTeamName(match.team1Id)}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={score1}
                          onChange={(e) => setScore1(e.target.value)}
                          min="0"
                          className="w-12 px-2 py-1 text-center bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        <span className="text-[var(--color-text-muted)]">-</span>
                        <input
                          type="number"
                          value={score2}
                          onChange={(e) => setScore2(e.target.value)}
                          min="0"
                          className="w-12 px-2 py-1 text-center bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <span className="flex-1 text-[var(--color-text)] font-medium truncate">
                        {getTeamName(match.team2Id)}
                      </span>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleSaveResult(match.id)}
                          className="px-3 py-1 bg-[var(--color-success)] text-white text-sm rounded-lg hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMatch(null)}
                          className="px-3 py-1 bg-[var(--color-surface-light)] text-[var(--color-text-muted)] text-sm rounded-lg hover:opacity-90"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`flex-1 text-right font-medium truncate ${
                        match.status === 'completed' && match.team1Score !== null && match.team2Score !== null
                          ? match.team1Score > match.team2Score
                            ? 'text-[var(--color-success)]'
                            : match.team1Score < match.team2Score
                            ? 'text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text)]'
                          : 'text-[var(--color-text)]'
                      }`}>
                        {getTeamName(match.team1Id)}
                      </span>
                      
                      <div className="flex items-center gap-2 min-w-[80px] justify-center">
                        {match.status === 'completed' ? (
                          <span className="px-3 py-1 bg-[var(--color-surface)] rounded-lg font-bold text-[var(--color-text)]">
                            {match.team1Score} - {match.team2Score}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-[var(--color-surface-light)] rounded-lg text-[var(--color-text-muted)] text-sm">
                            vs
                          </span>
                        )}
                      </div>

                      <span className={`flex-1 font-medium truncate ${
                        match.status === 'completed' && match.team1Score !== null && match.team2Score !== null
                          ? match.team2Score > match.team1Score
                            ? 'text-[var(--color-success)]'
                            : match.team2Score < match.team1Score
                            ? 'text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text)]'
                          : 'text-[var(--color-text)]'
                      }`}>
                        {getTeamName(match.team2Id)}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={() => startEditing(match)}
                          className="px-3 py-1 bg-[var(--color-surface-light)] text-[var(--color-text-muted)] text-sm rounded-lg hover:text-[var(--color-text)] transition-colors"
                        >
                          {match.status === 'completed' ? 'Edit' : 'Enter'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-[var(--color-surface-light)]">
        <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
          <span>Total matches: {matches.length}</span>
          <span>Completed: {matches.filter(m => m.status === 'completed').length}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchSchedule;

