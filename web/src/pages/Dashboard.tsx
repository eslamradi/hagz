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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'badge-success';
      case 'allocating':
        return 'badge-warning';
      case 'in-progress':
        return 'badge-primary';
      case 'completed':
        return 'badge';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading rooms...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-[var(--color-text)] tracking-tight">Browse Rooms</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Find and join football matches near you</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-surface-secondary)] rounded-full mb-6">
            <span className="text-4xl">⚽</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">No rooms available</h2>
          <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto mb-8">
            Ask someone to share their room code with you, or create your own room to get started.
          </p>
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Room
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking, index) => (
            <Link
              key={booking.id}
              to={`/booking/${booking.code}`}
              className={`group block bg-white rounded-2xl border border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-border-dark)] transition-all duration-200 overflow-hidden animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card Header with gradient */}
              <div className="h-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]" />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-primary-bg)] px-3 py-1.5 rounded-lg tracking-wider">
                    {booking.code}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${getStatusBadge(booking.status)}`}>
                    {booking.status.replace('-', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                  {booking.description || 'Football Match'}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(booking.playDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{booking.acceptedCapacity} players max</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{booking.numTeams} teams • {booking.playMode === 'league' ? 'League' : 'Rotational'}</span>
                  </div>
                </div>

                {booking.locationUrl && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(booking.locationUrl, '_blank');
                      }}
                      className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View location
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick code entry */}
      <div className="mt-12 bg-[var(--color-surface-secondary)] rounded-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">Have a room code?</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Enter the 6-character code to join a room directly</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem('code') as HTMLInputElement;
              if (input.value) {
                window.location.href = `/booking/${input.value}`;
              }
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              name="code"
              placeholder="ABC123"
              className="w-40 px-4 py-3 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] text-center placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all uppercase tracking-widest font-mono font-semibold"
              maxLength={6}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[var(--color-text)] text-white font-semibold rounded-xl hover:bg-[var(--color-text)]/90 transition-all"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
