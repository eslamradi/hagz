import type { Player } from '../types';

interface BookingListProps {
  players: Player[];
  capacity: number;
  currentUserId: string | null;
  onRemovePlayer: (playerId: string) => void;
  canRemove: (player: Player) => boolean;
}

const BookingList = ({
  players,
  capacity,
  currentUserId,
  onRemovePlayer,
  canRemove
}: BookingListProps) => {
  const isFull = players.length >= capacity;
  const percentage = Math.min((players.length / capacity) * 100, 100);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Active Players</h2>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
            isFull 
              ? 'bg-[#fef3e2] text-[var(--color-warning)]' 
              : 'bg-[#e6f4ea] text-[var(--color-success)]'
          }`}>
            {players.length} / {capacity}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFull ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          {isFull ? 'List is full' : `${capacity - players.length} spot${capacity - players.length !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Players List */}
      <div className="p-6 flex-1 overflow-y-auto">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-surface-secondary)] rounded-full mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-[var(--color-text)] font-medium">No players yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Be the first to join!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {players.map((player, index) => (
              <li
                key={player.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-border)] transition-all group animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-10 h-10 rounded-full bg-[var(--color-primary-bg)] text-[var(--color-primary)] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {player.position}
                  </span>
                  <div>
                    <span className={`text-[var(--color-text)] ${
                      player.userId === currentUserId ? 'font-semibold' : ''
                    }`}>
                      {player.playerName}
                    </span>
                    {player.userId === currentUserId && (
                      <span className="ml-2 text-xs text-[var(--color-primary)] bg-[var(--color-primary-bg)] px-2 py-0.5 rounded font-medium">(You)</span>
                    )}
                    {!player.userId && player.addedBy && (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">Guest</span>
                    )}
                  </div>
                </div>
                
                {canRemove(player) && (
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    className="inline-flex items-center justify-center p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[#fce8e6] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove player"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BookingList;
