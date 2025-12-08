import { useState } from 'react';

interface AddPlayerFormProps {
  onAddPlayer: (playerName: string, isGuest: boolean) => void;
  isLoggedIn: boolean;
  userName?: string;
}

const AddPlayerForm = ({
  onAddPlayer,
  isLoggedIn,
  userName
}: AddPlayerFormProps) => {
  const [playerName, setPlayerName] = useState('');
  const [addingSelf, setAddingSelf] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameToAdd = addingSelf && isLoggedIn && userName ? userName : playerName;
    if (!nameToAdd.trim()) return;

    setLoading(true);
    try {
      await onAddPlayer(nameToAdd.trim(), !addingSelf || !isLoggedIn);
      setPlayerName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden animate-fade-in h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Add Player</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Join this match</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
        {isLoggedIn && (
          <div className="flex p-1.5 bg-[var(--color-surface-secondary)] rounded-xl">
            <button
              type="button"
              onClick={() => setAddingSelf(true)}
              className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[40px] ${
                addingSelf
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Add Myself
            </button>
            <button
              type="button"
              onClick={() => setAddingSelf(false)}
              className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[40px] ${
                !addingSelf
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Add Friend
            </button>
          </div>
        )}

        {(!isLoggedIn || !addingSelf) && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              {isLoggedIn ? "Friend's Name" : 'Your Name'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={isLoggedIn ? "Enter friend's name" : 'Enter your name'}
              className="w-full px-4 py-3.5 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
              required={!addingSelf || !isLoggedIn}
            />
          </div>
        )}

        {addingSelf && isLoggedIn && userName && (
          <div className="p-5 bg-[var(--color-primary-bg)] rounded-xl">
            <p className="text-xs text-[var(--color-primary)] font-medium mb-1">Adding as</p>
            <p className="text-[var(--color-text)] font-semibold text-lg">{userName}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || ((!addingSelf || !isLoggedIn) && !playerName.trim())}
          className="w-full inline-flex items-center justify-center px-6 py-4 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </span>
          ) : (
            'Add to List'
          )}
        </button>

        {!isLoggedIn && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-3 px-4 bg-[var(--color-surface-secondary)] rounded-xl">
            💡 Sign in for a better experience
          </p>
        )}
      </form>
    </div>
  );
};

export default AddPlayerForm;
