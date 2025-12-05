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
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] animate-fade-in">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-5">
        Add Player
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isLoggedIn && (
          <div className="flex gap-2.5 p-1.5 bg-[var(--color-background)] rounded-xl">
            <button
              type="button"
              onClick={() => setAddingSelf(true)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                addingSelf
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Add Myself
            </button>
            <button
              type="button"
              onClick={() => setAddingSelf(false)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                !addingSelf
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Add Friend
            </button>
          </div>
        )}

        {(!isLoggedIn || !addingSelf) && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
              {isLoggedIn ? "Friend's Name" : 'Your Name'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={isLoggedIn ? "Enter friend's name" : 'Enter your name'}
              className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
              required={!addingSelf || !isLoggedIn}
            />
          </div>
        )}

        {addingSelf && isLoggedIn && userName && (
          <div className="p-5 bg-[var(--color-background)] rounded-xl border border-[var(--color-surface-light)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Adding as:</p>
            <p className="text-[var(--color-text)] font-semibold text-lg">{userName}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || ((!addingSelf || !isLoggedIn) && !playerName.trim())}
          className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? 'Adding...' : 'Add to List'}
        </button>

        {!isLoggedIn && (
          <p className="text-xs text-[var(--color-text-muted)] text-center p-3 bg-[var(--color-background)] rounded-lg">
            💡 Login for a better experience and to track your bookings.
          </p>
        )}
      </form>
    </div>
  );
};

export default AddPlayerForm;
