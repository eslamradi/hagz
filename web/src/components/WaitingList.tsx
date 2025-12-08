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
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Waiting List</h2>
          <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
            {players.length} waiting
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-surface-secondary)] rounded-full mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-[var(--color-text)] font-medium">No one waiting</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Queue is empty</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-[var(--color-text-secondary)] mb-5 p-4 bg-[var(--color-surface-secondary)] rounded-xl flex items-start gap-3">
              <span className="text-lg">💡</span>
              <span>Players will be automatically promoted when spots open up</span>
            </div>
            <ul className="space-y-3">
              {players.map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-dashed border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-all group animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="w-10 h-10 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <span className={`${
                        player.userId === currentUserId 
                          ? 'font-semibold text-[var(--color-text)]' 
                          : 'text-[var(--color-text-secondary)]'
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
          </>
        )}
      </div>
    </div>
  );
};

export default WaitingList;
