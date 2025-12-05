import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking, subscribeToAllBookings, deleteBooking, updateBooking } from '../services/bookings';
import type { Booking, PlayMode } from '../types';

const MyRooms = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const myBookings = allBookings.filter(b => b.createdBy === firebaseUser?.uid);

  const [playDate, setPlayDate] = useState('');
  const [playTime, setPlayTime] = useState('');
  const [description, setDescription] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [acceptedCapacity, setAcceptedCapacity] = useState(15);
  const [numTeams, setNumTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(7);
  const [playMode, setPlayMode] = useState<PlayMode>('league');

  useEffect(() => {
    const unsubscribe = subscribeToAllBookings(setAllBookings);
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    setLoading(true);
    try {
      const dateTime = new Date(`${playDate}T${playTime}`);
      
      await createBooking({
        playDate: dateTime,
        description,
        locationUrl,
        acceptedCapacity,
        numTeams,
        playersPerTeam,
        playMode,
        createdBy: firebaseUser.uid
      });

      setShowCreateForm(false);
      setPlayDate('');
      setPlayTime('');
      setDescription('');
      setLocationUrl('');
      setAcceptedCapacity(15);
      setNumTeams(2);
      setPlayersPerTeam(7);
      setPlayMode('league');
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this room? This cannot be undone.')) return;
    
    try {
      await deleteBooking(bookingId);
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await updateBooking(bookingId, { status: newStatus as Booking['status'] });
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/booking/${code}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const formatDate = (timestamp: { toDate: () => Date } | undefined) => {
    if (!timestamp) return 'No date';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">My Rooms</h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-lg">Create and manage your football booking rooms</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Create Room
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-8 border border-[var(--color-surface-light)] mb-10 animate-fade-in">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-8">Create New Room</h2>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                  Date
                </label>
                <input
                  type="date"
                  value={playDate}
                  onChange={(e) => setPlayDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                  Time
                </label>
                <input
                  type="time"
                  value={playTime}
                  onChange={(e) => setPlayTime(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Friday Night Football"
                className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                Location (Google Maps Link)
              </label>
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                  Accepted Players
                </label>
                <input
                  type="number"
                  value={acceptedCapacity}
                  onChange={(e) => setAcceptedCapacity(parseInt(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                  Number of Teams
                </label>
                <input
                  type="number"
                  value={numTeams}
                  onChange={(e) => setNumTeams(parseInt(e.target.value))}
                  min={2}
                  className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                  Players per Team
                </label>
                <input
                  type="number"
                  value={playersPerTeam}
                  onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-3">
                Play Mode
              </label>
              <div className="flex gap-3 p-1.5 bg-[var(--color-background)] rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setPlayMode('league')}
                  className={`px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                    playMode === 'league'
                      ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  🏆 League (with standings)
                </button>
                <button
                  type="button"
                  onClick={() => setPlayMode('rotational')}
                  className={`px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                    playMode === 'rotational'
                      ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  🔄 Rotational
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all disabled:opacity-50 disabled:hover:shadow-none"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-8 py-3.5 bg-[var(--color-surface-light)] text-[var(--color-text)] font-semibold rounded-xl hover:bg-[var(--color-surface-light)]/80 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Rooms List */}
      <div className="space-y-5">
        {myBookings.map((booking, index) => (
          <div
            key={booking.id}
            className={`bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] hover:border-[var(--color-surface-light)]/80 transition-all animate-fade-in stagger-${Math.min(index + 1, 5)}`}
          >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-5">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-sm font-mono bg-[var(--color-background)] px-4 py-2 rounded-lg text-[var(--color-primary)] font-semibold tracking-wide">
                    {booking.code}
                  </span>
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                    className="text-sm px-4 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-surface-light)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="open">🟢 Open</option>
                    <option value="allocating">🟡 Allocating</option>
                    <option value="in-progress">🔵 In Progress</option>
                    <option value="completed">⚫ Completed</option>
                  </select>
                </div>
                
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3">
                  {booking.description || 'Football Match'}
                </h3>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-2">📅 {formatDate(booking.playDate)}</span>
                  <span className="flex items-center gap-2">👥 {booking.acceptedCapacity} players</span>
                  <span className="flex items-center gap-2">🏆 {booking.numTeams} teams • {booking.playersPerTeam}/team</span>
                  <span className="flex items-center gap-2">🎮 {booking.playMode === 'league' ? 'League' : 'Rotational'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyLink(booking.code)}
                  className="px-5 py-2.5 bg-[var(--color-background)] text-[var(--color-text)] rounded-xl hover:bg-[var(--color-surface-light)] transition-all text-sm font-medium border border-[var(--color-surface-light)]"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => navigate(`/booking/${booking.code}`)}
                  className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all text-sm font-medium"
                >
                  View Room
                </button>
                <button
                  onClick={() => handleDelete(booking.id)}
                  className="px-5 py-2.5 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-xl hover:bg-[var(--color-error)]/20 transition-all text-sm font-medium border border-[var(--color-error)]/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {myBookings.length === 0 && (
          <div className="bg-[var(--color-surface)] rounded-3xl p-16 text-center border border-[var(--color-surface-light)]">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-3">No Rooms Yet</h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-md mx-auto">
              Create your first room to start organizing football matches with your friends!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRooms;
