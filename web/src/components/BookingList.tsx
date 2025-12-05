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

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Active Players
        </h2>
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
          isFull 
            ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30' 
            : 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30'
        }`}>
          {players.length}/{capacity}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-[var(--color-background)] rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isFull ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
          }`}
          style={{ width: `${Math.min((players.length / capacity) * 100, 100)}%` }}
        />
      </div>

      {players.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-text-muted)]">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-lg">No players yet</p>
          <p className="text-sm mt-1">Be the first to join!</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {players.map((player, index) => (
            <li
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl bg-[var(--color-background)] border border-transparent hover:border-[var(--color-surface-light)] transition-all animate-slide-in stagger-${Math.min(index + 1, 5)}`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
                  {player.position}
                </span>
                <div>
                  <span className={`text-[var(--color-text)] ${
                    player.userId === currentUserId ? 'font-semibold' : ''
                  }`}>
                    {player.playerName}
                  </span>
                  {player.userId === currentUserId && (
                    <span className="ml-2 text-xs text-[var(--color-primary)] font-medium">(You)</span>
                  )}
                  {!player.userId && player.addedBy && (
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">(Guest)</span>
                  )}
                </div>
              </div>
              
              {canRemove(player) && (
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-all"
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
  );
};

export default BookingList;
