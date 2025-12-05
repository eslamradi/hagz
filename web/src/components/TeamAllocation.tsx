import { useState } from 'react';
import type { Booking, Player, Team } from '../types';

interface TeamAllocationProps {
  booking: Booking;
  players: Player[];
  waitingPlayers: Player[];
  teams: Team[];
  isAdmin: boolean;
  onCreateTeams: () => void;
  onRecreateTeams: () => void;
  onRandomAllocate: () => void;
  onFullRandomAllocate: (pullFromWaitingList: boolean) => void;
  onAssignToTeam: (playerId: string, teamId: string) => void;
  onGenerateMatches: () => void;
  onUpdateSettings?: (data: { acceptedCapacity?: number; numTeams?: number; playersPerTeam?: number }) => void;
}

const TeamAllocation = ({
  booking,
  players,
  waitingPlayers,
  teams,
  isAdmin,
  onCreateTeams,
  onRecreateTeams,
  onRandomAllocate,
  onFullRandomAllocate,
  onAssignToTeam,
  onGenerateMatches,
  onUpdateSettings
}: TeamAllocationProps) => {
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  const unassignedPlayers = players.filter(p => !p.teamId);
  
  // Auto-save helper - immediately applies changes
  const handleSettingChange = (field: 'acceptedCapacity' | 'numTeams' | 'playersPerTeam', value: number) => {
    if (onUpdateSettings && value > 0) {
      onUpdateSettings({ [field]: value });
    }
  };
  
  // Check if team count doesn't match the booking settings
  const teamCountMismatch = teams.length > 0 && teams.length !== booking.numTeams;
  
  // Calculate capacity info
  const totalSpotsNeeded = booking.numTeams * booking.playersPerTeam;
  const activePlayers = players.length;
  const waitingCount = waitingPlayers.length;
  const shortage = totalSpotsNeeded - activePlayers;
  const canFillFromWaiting = shortage > 0 && waitingCount > 0;
  const playersNeededFromWaiting = Math.min(shortage, waitingCount);
  const stillShort = shortage - playersNeededFromWaiting;

  const getTeamPlayers = (teamId: string) => {
    return players.filter(p => p.teamId === teamId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Team Management
            </h2>
            <button
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              className="text-sm px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Quick Settings
            </button>
          </div>

          {/* Quick Settings Panel - Auto-applies changes */}
          {showQuickSettings && (
            <div className="mb-6 p-5 bg-[var(--color-background)] rounded-xl border border-[var(--color-surface-light)] animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Capacity Settings</h3>
                <span className="text-xs text-[var(--color-success)]">✓ Auto-saves</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Accepted Players
                  </label>
                  <input
                    type="number"
                    value={booking.acceptedCapacity}
                    onChange={(e) => handleSettingChange('acceptedCapacity', parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Number of Teams
                  </label>
                  <input
                    type="number"
                    value={booking.numTeams}
                    onChange={(e) => handleSettingChange('numTeams', parseInt(e.target.value) || 2)}
                    min={2}
                    className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Players per Team
                  </label>
                  <input
                    type="number"
                    value={booking.playersPerTeam}
                    onChange={(e) => handleSettingChange('playersPerTeam', parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-center font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Current Settings Display */}
          <div className="flex flex-wrap gap-4 mb-5 p-4 bg-[var(--color-background)] rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] text-sm">Teams:</span>
              <span className="font-semibold text-[var(--color-text)]">{booking.numTeams}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] text-sm">Per Team:</span>
              <span className="font-semibold text-[var(--color-text)]">{booking.playersPerTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] text-sm">Total Spots:</span>
              <span className="font-semibold text-[var(--color-warning)]">{totalSpotsNeeded}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] text-sm">Active:</span>
              <span className={`font-semibold ${activePlayers >= totalSpotsNeeded ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]'}`}>
                {activePlayers}
              </span>
            </div>
            {waitingCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-muted)] text-sm">Waiting:</span>
                <span className="font-semibold text-[var(--color-warning)]">{waitingCount}</span>
              </div>
            )}
          </div>
          
          {/* Capacity Status */}
          {shortage > 0 && (
            <div className={`mb-5 p-4 rounded-xl border ${canFillFromWaiting ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30' : 'bg-[var(--color-surface-light)] border-[var(--color-surface-light)]'}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{canFillFromWaiting ? '⚠️' : 'ℹ️'}</span>
                <div className="flex-1">
                  <p className={`font-medium ${canFillFromWaiting ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]'}`}>
                    {shortage} spot{shortage !== 1 ? 's' : ''} will be empty
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {canFillFromWaiting 
                      ? `Can pull ${playersNeededFromWaiting} from waiting list${stillShort > 0 ? ` (will still have ${stillShort} empty)` : ' to fill all spots'}.`
                      : 'Some teams will be partially filled. You can still continue with matches.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activePlayers > totalSpotsNeeded && (
            <div className="mb-5 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div className="flex-1">
                  <p className="text-blue-400 font-medium">
                    {activePlayers - totalSpotsNeeded} extra player{activePlayers - totalSpotsNeeded !== 1 ? 's' : ''} won't fit in teams
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Consider increasing teams or players per team in settings.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Team count mismatch warning */}
          {teamCountMismatch && (
            <div className="mb-5 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-[var(--color-warning)] font-medium">
                    Team count changed
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    You have {teams.length} teams but settings say {booking.numTeams}. Click "Recreate Teams" to update.
                  </p>
                </div>
                <button
                  onClick={onRecreateTeams}
                  className="px-4 py-2 bg-[var(--color-warning)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all"
                >
                  Recreate Teams
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {teams.length === 0 ? (
              <button
                onClick={onCreateTeams}
                className="px-5 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all"
              >
                Create {booking.numTeams} Teams
              </button>
            ) : (
              <>
                <button
                  onClick={onRecreateTeams}
                  className="px-5 py-2.5 bg-[var(--color-surface-light)] text-[var(--color-text)] font-medium rounded-xl hover:bg-[var(--color-surface-light)]/80 transition-all"
                >
                  Recreate Teams ({booking.numTeams})
                </button>
                <button
                  onClick={onRandomAllocate}
                  className="px-5 py-2.5 bg-[var(--color-surface-light)] text-[var(--color-text)] font-medium rounded-xl hover:bg-[var(--color-surface-light)]/80 transition-all"
                >
                  Random Fill ({unassignedPlayers.length} unassigned)
                </button>
                <button
                  onClick={() => onFullRandomAllocate(false)}
                  className="px-5 py-2.5 bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-medium rounded-xl hover:bg-[var(--color-warning)]/25 transition-all border border-[var(--color-warning)]/30"
                >
                  Full Random Shuffle
                </button>
                {canFillFromWaiting && (
                  <button
                    onClick={() => onFullRandomAllocate(true)}
                    className="px-5 py-2.5 bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-medium rounded-xl hover:bg-[var(--color-primary)]/25 transition-all border border-[var(--color-primary)]/30"
                  >
                    Shuffle + Pull {playersNeededFromWaiting} from Waiting
                  </button>
                )}
                {booking.playMode === 'league' && teams.length >= 2 && (
                  <button
                    onClick={onGenerateMatches}
                    className="px-5 py-2.5 bg-[var(--color-success)] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[var(--color-success)]/25 transition-all"
                  >
                    Generate Match Schedule
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl p-16 text-center border border-[var(--color-surface-light)]">
          <div className="text-6xl mb-5">🏆</div>
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-3">
            No Teams Yet
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg">
            {isAdmin ? 'Create teams to start allocating players.' : 'Waiting for room owner to create teams.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Unassigned Players */}
          {unassignedPlayers.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-6 border-2 border-dashed border-[var(--color-surface-light)]">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-5">
                Unassigned ({unassignedPlayers.length})
              </h3>
              <ul className="space-y-2.5">
                {unassignedPlayers.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-background)]"
                  >
                    <span className="text-[var(--color-text)]">{player.playerName}</span>
                    {isAdmin && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onAssignToTeam(player.id, e.target.value);
                          }
                        }}
                        className="text-sm px-3 py-1.5 bg-[var(--color-surface-light)] border-none rounded-lg text-[var(--color-text)] focus:outline-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="">Assign to...</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teams */}
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
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    {team.teamName}
                  </h3>
                  <span className={`text-sm font-semibold px-3.5 py-1.5 rounded-full ${
                    isFull
                      ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]'
                  }`}>
                    {teamPlayers.length}/{booking.playersPerTeam}
                  </span>
                </div>

                {teamPlayers.length === 0 ? (
                  <p className="text-center py-6 text-[var(--color-text-muted)]">
                    No players assigned
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {teamPlayers.map((player, pIndex) => (
                      <li
                        key={player.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-background)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold">
                            {pIndex + 1}
                          </span>
                          <span className="text-[var(--color-text)]">{player.playerName}</span>
                        </div>
                        {isAdmin && (
                          <select
                            value={player.teamId || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                onAssignToTeam(player.id, e.target.value);
                              }
                            }}
                            className="text-xs px-2.5 py-1.5 bg-[var(--color-surface-light)] border-none rounded-lg text-[var(--color-text-muted)] focus:outline-none cursor-pointer"
                          >
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.teamName}
                              </option>
                            ))}
                          </select>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamAllocation;
