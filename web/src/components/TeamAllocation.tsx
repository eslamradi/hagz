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
  
  const handleSettingChange = (field: 'acceptedCapacity' | 'numTeams' | 'playersPerTeam', value: number) => {
    if (onUpdateSettings && value > 0) {
      onUpdateSettings({ [field]: value });
    }
  };
  
  const teamCountMismatch = teams.length > 0 && teams.length !== booking.numTeams;
  
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
        <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Team Management</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Configure teams and allocate players</p>
              </div>
              <button
                onClick={() => setShowQuickSettings(!showQuickSettings)}
                className={`inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all gap-2 ${
                  showQuickSettings 
                    ? 'bg-[var(--color-text)] text-white' 
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>

          {/* Quick Settings */}
          {showQuickSettings && (
            <div className="p-6 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[var(--color-text)]">Capacity Settings</span>
                <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Auto-saves
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Accepted Players
                  </label>
                  <input
                    type="number"
                    value={booking.acceptedCapacity}
                    onChange={(e) => handleSettingChange('acceptedCapacity', parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Number of Teams
                  </label>
                  <input
                    type="number"
                    value={booking.numTeams}
                    onChange={(e) => handleSettingChange('numTeams', parseInt(e.target.value) || 2)}
                    min={2}
                    className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Players per Team
                  </label>
                  <input
                    type="number"
                    value={booking.playersPerTeam}
                    onChange={(e) => handleSettingChange('playersPerTeam', parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all text-center font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="px-6 py-4 flex flex-wrap items-center gap-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)] text-sm">Teams</span>
              <span className="font-semibold text-[var(--color-text)] bg-[var(--color-surface-secondary)] px-2.5 py-1 rounded-lg text-sm">{booking.numTeams}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)] text-sm">Per team</span>
              <span className="font-semibold text-[var(--color-text)] bg-[var(--color-surface-secondary)] px-2.5 py-1 rounded-lg text-sm">{booking.playersPerTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)] text-sm">Total spots</span>
              <span className="font-semibold text-[var(--color-warning)] bg-[#fef3e2] px-2.5 py-1 rounded-lg text-sm">{totalSpotsNeeded}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)] text-sm">Active</span>
              <span className={`font-semibold px-2.5 py-1 rounded-lg text-sm ${
                activePlayers >= totalSpotsNeeded 
                  ? 'text-[var(--color-success)] bg-[#e6f4ea]' 
                  : 'text-[var(--color-primary)] bg-[var(--color-primary-bg)]'
              }`}>
                {activePlayers}
              </span>
            </div>
            {waitingCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-secondary)] text-sm">Waiting</span>
                <span className="font-semibold text-[var(--color-warning)] bg-[#fef3e2] px-2.5 py-1 rounded-lg text-sm">{waitingCount}</span>
              </div>
            )}
          </div>
          
          {/* Warnings */}
          {(shortage > 0 || teamCountMismatch || activePlayers > totalSpotsNeeded) && (
            <div className="px-6 py-4 space-y-3 border-b border-[var(--color-border)]">
              {shortage > 0 && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${
                  canFillFromWaiting ? 'bg-[#fef3e2]' : 'bg-[var(--color-surface-secondary)]'
                }`}>
                  <span className="text-lg">{canFillFromWaiting ? '⚠️' : 'ℹ️'}</span>
                  <div>
                    <p className={`font-medium text-sm ${canFillFromWaiting ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {shortage} spot{shortage !== 1 ? 's' : ''} will be empty
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {canFillFromWaiting 
                        ? `Can pull ${playersNeededFromWaiting} from waiting list${stillShort > 0 ? ` (will still have ${stillShort} empty)` : ''}`
                        : 'You can still continue with matches'}
                    </p>
                  </div>
                </div>
              )}
              
              {activePlayers > totalSpotsNeeded && (
                <div className="p-4 rounded-xl bg-[#e8f4fd] flex items-start gap-3">
                  <span className="text-lg">ℹ️</span>
                  <div>
                    <p className="font-medium text-sm text-[var(--color-info)]">
                      {activePlayers - totalSpotsNeeded} extra player{activePlayers - totalSpotsNeeded !== 1 ? 's' : ''} won't fit
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Consider increasing teams or players per team
                    </p>
                  </div>
                </div>
              )}
              
              {teamCountMismatch && (
                <div className="p-4 rounded-xl bg-[#fef3e2] flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="font-medium text-sm text-[var(--color-warning)]">Team count changed</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {teams.length} teams exist, but settings say {booking.numTeams}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onRecreateTeams}
                    className="px-4 py-2 bg-[var(--color-warning)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
                  >
                    Recreate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {teams.length === 0 ? (
                <button
                  onClick={onCreateTeams}
                  className="inline-flex items-center justify-center px-5 py-3 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-all min-h-[44px]"
                >
                  Create {booking.numTeams} Teams
                </button>
              ) : (
                <>
                  <button
                    onClick={onRecreateTeams}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-[var(--color-text)] font-medium rounded-xl border border-[var(--color-border-dark)] hover:bg-[var(--color-surface-secondary)] transition-all text-sm min-h-[40px]"
                  >
                    Recreate Teams
                  </button>
                  <button
                    onClick={onRandomAllocate}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-[var(--color-text)] font-medium rounded-xl border border-[var(--color-border-dark)] hover:bg-[var(--color-surface-secondary)] transition-all text-sm min-h-[40px]"
                  >
                    Random Fill ({unassignedPlayers.length})
                  </button>
                  <button
                    onClick={() => onFullRandomAllocate(false)}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-[#fef3e2] text-[var(--color-warning)] font-medium rounded-xl border border-[var(--color-warning)]/30 hover:bg-[#fde9cc] transition-all text-sm min-h-[40px]"
                  >
                    Full Shuffle
                  </button>
                  {canFillFromWaiting && (
                    <button
                      onClick={() => onFullRandomAllocate(true)}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-medium rounded-xl border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/20 transition-all text-sm min-h-[40px]"
                    >
                      + {playersNeededFromWaiting} from Waiting
                    </button>
                  )}
                  {booking.playMode === 'league' && teams.length >= 2 && (
                    <button
                      onClick={onGenerateMatches}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-all text-sm min-h-[40px]"
                    >
                      Generate Matches
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teams Display */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-surface-secondary)] rounded-full mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">No Teams Yet</h2>
          <p className="text-[var(--color-text-secondary)]">
            {isAdmin ? 'Create teams to start allocating players' : 'Waiting for room owner to create teams'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Unassigned */}
          {unassignedPlayers.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[var(--color-border)] p-6">
              <h3 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center justify-between">
                Unassigned
                <span className="text-sm font-normal text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-2.5 py-1 rounded-full">
                  {unassignedPlayers.length}
                </span>
              </h3>
              <ul className="space-y-2">
                {unassignedPlayers.map((player) => (
                  <li key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]">
                    <span className="text-sm text-[var(--color-text)]">{player.playerName}</span>
                    {isAdmin && (
                      <select
                        onChange={(e) => e.target.value && onAssignToTeam(player.id, e.target.value)}
                        className="text-xs px-2 py-1 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] focus:outline-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="">Assign...</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>{team.teamName}</option>
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
                className={`bg-white rounded-2xl border p-6 transition-all animate-fade-in ${
                  isFull ? 'border-[var(--color-success)]' : 'border-[var(--color-border)]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{team.teamName}</h3>
                  <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                    isFull
                      ? 'bg-[#e6f4ea] text-[var(--color-success)]'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                  }`}>
                    {teamPlayers.length}/{booking.playersPerTeam}
                  </span>
                </div>

                {teamPlayers.length === 0 ? (
                  <p className="text-center py-8 text-sm text-[var(--color-text-muted)]">No players yet</p>
                ) : (
                  <ul className="space-y-2">
                    {teamPlayers.map((player, pIndex) => (
                      <li key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[var(--color-primary-bg)] text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold">
                            {pIndex + 1}
                          </span>
                          <span className="text-sm text-[var(--color-text)]">{player.playerName}</span>
                        </div>
                        {isAdmin && (
                          <select
                            value={player.teamId || ''}
                            onChange={(e) => e.target.value && onAssignToTeam(player.id, e.target.value)}
                            className="text-xs px-2 py-1 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] focus:outline-none cursor-pointer"
                          >
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>{t.teamName}</option>
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
