import { useState } from 'react';
import type { Booking } from '../types';

interface RoomSettingsProps {
  booking: Booking;
  onSave: (data: Partial<Booking>) => Promise<void>;
  onClose: () => void;
}

const RoomSettings = ({ booking, onSave, onClose }: RoomSettingsProps) => {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const playDateObj = booking.playDate?.toDate?.() || new Date();
  const [playDate, setPlayDate] = useState(playDateObj.toISOString().split('T')[0]);
  const [playTime, setPlayTime] = useState(
    playDateObj.toTimeString().slice(0, 5)
  );
  const [description, setDescription] = useState(booking.description || '');
  const [locationUrl, setLocationUrl] = useState(booking.locationUrl || '');
  const [acceptedCapacity, setAcceptedCapacity] = useState(booking.acceptedCapacity);
  const [numTeams, setNumTeams] = useState(booking.numTeams);
  const [playersPerTeam, setPlayersPerTeam] = useState(booking.playersPerTeam);
  const [playMode, setPlayMode] = useState(booking.playMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateTime = new Date(`${playDate}T${playTime}`);
      
      await onSave({
        playDate: { toDate: () => dateTime } as any,
        description,
        locationUrl,
        acceptedCapacity,
        numTeams,
        playersPerTeam,
        playMode
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--color-border)] shadow-2xl">
        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Room Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Date
              </label>
              <input
                type="date"
                value={playDate}
                onChange={(e) => setPlayDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Time
              </label>
              <input
                type="time"
                value={playTime}
                onChange={(e) => setPlayTime(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Friday Night Football"
              className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Location (Google Maps Link)
            </label>
            <input
              type="url"
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
            />
          </div>

          {/* Capacity Settings */}
          <div className="p-5 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <span>👥</span> Capacity Settings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                  Accepted Players
                </label>
                <input
                  type="number"
                  value={acceptedCapacity}
                  onChange={(e) => setAcceptedCapacity(parseInt(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all text-center font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                  Number of Teams
                </label>
                <input
                  type="number"
                  value={numTeams}
                  onChange={(e) => setNumTeams(parseInt(e.target.value))}
                  min={2}
                  className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all text-center font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                  Players per Team
                </label>
                <input
                  type="number"
                  value={playersPerTeam}
                  onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all text-center font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Play Mode */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
              Play Mode
            </label>
            <div className="flex gap-3 p-1 bg-[var(--color-surface-secondary)] rounded-xl">
              <button
                type="button"
                onClick={() => setPlayMode('league')}
                className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                  playMode === 'league'
                    ? 'bg-white text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                🏆 League
              </button>
              <button
                type="button"
                onClick={() => setPlayMode('rotational')}
                className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                  playMode === 'rotational'
                    ? 'bg-white text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                🔄 Rotational
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-[var(--color-border)]">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[var(--color-text)] font-semibold rounded-xl border border-[var(--color-border-dark)] hover:bg-[var(--color-surface-secondary)] transition-all min-h-[52px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomSettings;
