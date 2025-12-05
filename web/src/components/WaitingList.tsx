import type { Player } from '../types';

interface WaitingListProps {
  players: Player[];
  currentUserId: string | null;
  onRemovePlayer: (playerId: string) => void;
  canRemove: (player: Player) => boolean;
}

const WaitingList = ({
  players,
  currentUserId,
  onRemovePlayer,
  canRemove
}: WaitingListProps) => {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Waiting List
        </h2>
        <span className="text-sm font-medium px-4 py-1.5 rounded-full bg-[var(--color-surface-light)] text-[var(--color-text-muted)]">
          {players.length} waiting
        </span>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-text-muted)]">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-lg">No one waiting</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-text-muted)] mb-5 p-3 bg-[var(--color-background)] rounded-lg">
            💡 These players will be automatically promoted when spots open up.
          </p>
          <ul className="space-y-2.5">
            {players.map((player, index) => (
              <li
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl bg-[var(--color-background)] border border-dashed border-[var(--color-surface-light)] animate-slide-in stagger-${Math.min(index + 1, 5)}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-[var(--color-surface-light)] text-[var(--color-text-muted)] flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <span className={`text-[var(--color-text-muted)] ${
                      player.userId === currentUserId ? 'font-semibold text-[var(--color-text)]' : ''
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
        </>
      )}
    </div>
  );
};

export default WaitingList;
