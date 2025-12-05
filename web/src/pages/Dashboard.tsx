import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToAllBookings } from '../services/bookings';
import type { Booking } from '../types';

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllBookings((data) => {
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30';
      case 'allocating':
        return 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30';
      case 'in-progress':
        return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30';
      case 'completed':
        return 'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)] border border-[var(--color-text-muted)]/30';
      default:
        return 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse-slow text-[var(--color-primary)] text-lg">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Browse Rooms</h1>
        <p className="text-[var(--color-text-muted)] mt-2 text-lg">Find and join football matches</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-3xl p-16 text-center border border-[var(--color-surface-light)]">
          <div className="text-6xl mb-6">⚽</div>
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-3">No Rooms Yet</h2>
          <p className="text-[var(--color-text-muted)] text-lg max-w-md mx-auto">
            Ask someone to share their room code with you, or create your own room to get started.
          </p>
          <Link
            to="/my-bookings"
            className="inline-block mt-8 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all"
          >
            Create Your First Room
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking, index) => (
            <Link
              key={booking.id}
              to={`/booking/${booking.code}`}
              className={`group bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] hover:border-[var(--color-primary)]/50 transition-all hover:shadow-xl hover:shadow-[var(--color-primary)]/5 animate-fade-in stagger-${Math.min(index + 1, 5)}`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="text-sm font-mono bg-[var(--color-background)] px-3.5 py-1.5 rounded-lg text-[var(--color-primary)] font-semibold tracking-wide">
                  {booking.code}
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                {booking.description || 'Football Match'}
              </h3>

              <div className="space-y-2.5 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📅</span>
                  <span>{formatDate(booking.playDate)}</span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👥</span>
                  <span>{booking.acceptedCapacity} players</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏆</span>
                  <span>
                    {booking.numTeams} teams • {booking.playMode === 'league' ? 'League' : 'Rotational'}
                  </span>
                </div>
              </div>

              {booking.locationUrl && (
                <div className="mt-5 pt-4 border-t border-[var(--color-surface-light)]">
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(booking.locationUrl, '_blank');
                    }}
                    className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>📍</span>
                    View Location
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Quick code entry */}
      <div className="mt-12 bg-[var(--color-surface)] rounded-2xl p-8 border border-[var(--color-surface-light)]">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-5">Have a room code?</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('code') as HTMLInputElement;
            if (input.value) {
              window.location.href = `/booking/${input.value}`;
            }
          }}
          className="flex gap-4"
        >
          <input
            type="text"
            name="code"
            placeholder="Enter code (e.g., ABC123)"
            className="flex-1 px-5 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all uppercase tracking-widest font-mono"
            maxLength={6}
          />
          <button
            type="submit"
            className="px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
