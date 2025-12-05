import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getBookingByCode,
  subscribeToBooking,
  subscribeToPlayers,
  addPlayerToBooking,
  removePlayerFromBooking,
  canRemovePlayer
} from '../services/bookings';
import { subscribeToTeams, createTeams, recreateTeams, randomlyAllocatePlayers, fullyRandomAllocate, assignPlayerToTeam } from '../services/teams';
import { subscribeToMatches, generateRoundRobinMatches, updateMatchResult, calculateLeagueStandings } from '../services/matches';
import { updateBooking, updateBookingWithCapacityCheck } from '../services/bookings';
import type { Booking, Player, Team, Match, LeagueStanding } from '../types';
import BookingList from '../components/BookingList';
import WaitingList from '../components/WaitingList';
import AddPlayerForm from '../components/AddPlayerForm';
import TeamAllocation from '../components/TeamAllocation';
import LeagueTable from '../components/LeagueTable';
import MatchSchedule from '../components/MatchSchedule';
import RotationalView from '../components/RotationalView';
import RoomSettings from '../components/RoomSettings';
import { Timestamp } from 'firebase/firestore';

const BookingView = () => {
  const { code } = useParams<{ code: string }>();
  const { firebaseUser, userData } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'teams' | 'league' | 'rotational'>('players');
  const [showSettings, setShowSettings] = useState(false);

  // Initial load - get booking by code
  useEffect(() => {
    const loadBooking = async () => {
      if (!code) return;
      
      try {
        const bookingData = await getBookingByCode(code);
        if (bookingData) {
          setBooking(bookingData);
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [code]);

  // Subscribe to real-time updates once we have the booking
  useEffect(() => {
    if (!booking?.id) return;

    const unsubscribeBooking = subscribeToBooking(booking.id, (data) => {
      if (data) setBooking(data);
    });

    const unsubscribePlayers = subscribeToPlayers(booking.id, setPlayers);
    const unsubscribeTeams = subscribeToTeams(booking.id, setTeams);
    const unsubscribeMatches = subscribeToMatches(booking.id, setMatches);

    return () => {
      unsubscribeBooking();
      unsubscribePlayers();
      unsubscribeTeams();
      unsubscribeMatches();
    };
  }, [booking?.id]);

  // Calculate standings when matches or teams change
  useEffect(() => {
    if (teams.length > 0 && matches.length > 0) {
      setStandings(calculateLeagueStandings(teams, matches));
    }
  }, [teams, matches]);

  const activePlayers = players.filter(p => p.status === 'active');
  const waitingPlayers = players.filter(p => p.status === 'waiting');
  
  // Check if current user is the owner of this booking
  const isOwner = booking ? booking.createdBy === firebaseUser?.uid : false;

  const handleAddPlayer = async (playerName: string, isGuest: boolean) => {
    if (!booking) return;
    
    try {
      await addPlayerToBooking(booking.id, {
        playerName,
        addedBy: firebaseUser?.uid || null,
        userId: isGuest ? null : firebaseUser?.uid || null
      });
    } catch (err) {
      console.error('Error adding player:', err);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!booking) return;
    
    try {
      await removePlayerFromBooking(booking.id, playerId);
    } catch (err) {
      console.error('Error removing player:', err);
    }
  };

  const handleCreateTeams = async () => {
    if (!booking) return;
    
    try {
      await createTeams(booking.id, booking.numTeams);
      await updateBooking(booking.id, { status: 'allocating' });
    } catch (err) {
      console.error('Error creating teams:', err);
    }
  };

  const handleRecreateTeams = async () => {
    if (!booking) return;
    
    if (!confirm(`This will delete all ${teams.length} existing teams and create ${booking.numTeams} new teams. All player assignments will be cleared. Continue?`)) {
      return;
    }
    
    try {
      await recreateTeams(booking.id, booking.numTeams);
      await updateBooking(booking.id, { status: 'allocating' });
    } catch (err) {
      console.error('Error recreating teams:', err);
    }
  };

  const handleRandomAllocate = async () => {
    if (!booking) return;
    
    try {
      await randomlyAllocatePlayers(booking.id, players, teams, booking.playersPerTeam);
    } catch (err) {
      console.error('Error allocating players:', err);
    }
  };

  const handleFullRandomAllocate = async (pullFromWaitingList: boolean = false) => {
    if (!booking) return;
    
    try {
      // Get all players including waiting if pulling from waiting list
      const allPlayers = pullFromWaitingList 
        ? players // players from subscribeToPlayers includes all statuses
        : activePlayers;
      await fullyRandomAllocate(booking.id, allPlayers, teams, booking.playersPerTeam, pullFromWaitingList);
    } catch (err) {
      console.error('Error allocating players:', err);
    }
  };

  const handleAssignToTeam = async (playerId: string, teamId: string) => {
    if (!booking) return;
    
    try {
      await assignPlayerToTeam(booking.id, playerId, teamId);
    } catch (err) {
      console.error('Error assigning player:', err);
    }
  };

  const handleGenerateMatches = async () => {
    if (!booking || teams.length < 2) return;
    
    try {
      await generateRoundRobinMatches(booking.id, teams);
      await updateBooking(booking.id, { status: 'in-progress' });
    } catch (err) {
      console.error('Error generating matches:', err);
    }
  };

  const handleUpdateMatchResult = async (matchId: string, team1Score: number, team2Score: number) => {
    if (!booking) return;
    
    try {
      await updateMatchResult(booking.id, matchId, team1Score, team2Score);
    } catch (err) {
      console.error('Error updating match:', err);
    }
  };

  const handleSaveSettings = async (data: Partial<Booking>) => {
    if (!booking) return;
    
    try {
      const updateData: Record<string, unknown> = {};
      
      if (data.playDate) {
        updateData.playDate = Timestamp.fromDate(data.playDate.toDate());
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.locationUrl !== undefined) updateData.locationUrl = data.locationUrl;
      if (data.acceptedCapacity !== undefined) updateData.acceptedCapacity = data.acceptedCapacity;
      if (data.numTeams !== undefined) updateData.numTeams = data.numTeams;
      if (data.playersPerTeam !== undefined) updateData.playersPerTeam = data.playersPerTeam;
      if (data.playMode !== undefined) updateData.playMode = data.playMode;
      
      // Use the capacity-aware update function
      await updateBookingWithCapacityCheck(
        booking.id, 
        updateData as Partial<Booking>,
        {
          acceptedCapacity: booking.acceptedCapacity,
          numTeams: booking.numTeams,
          playersPerTeam: booking.playersPerTeam
        }
      );
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const formatDate = (timestamp: { toDate: () => Date } | undefined) => {
    if (!timestamp) return 'No date';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-pulse-slow text-[var(--color-primary)] text-xl">Loading booking...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center px-4">
        <div className="bg-[var(--color-surface)] rounded-2xl p-8 text-center max-w-md border border-[var(--color-surface-light)]">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
            {error || 'Booking Not Found'}
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            The booking code "{code}" doesn't exist or has been removed.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-surface-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚽</span>
              </div>
              <span className="text-xl font-bold text-[var(--color-text)]">7agz</span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm font-mono bg-[var(--color-background)] px-3 py-1 rounded-lg text-[var(--color-primary)]">
                {booking.code}
              </span>
              {firebaseUser ? (
                <span className="text-[var(--color-text-muted)] text-sm">
                  {userData?.displayName}
                </span>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Info */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-surface-light)] mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                {booking.description || 'Football Match'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">📅 {formatDate(booking.playDate)}</span>
                <span className="flex items-center gap-1">👥 {activePlayers.length}/{booking.acceptedCapacity} players</span>
                <span className="flex items-center gap-1">🏆 {booking.numTeams} teams • {booking.playMode === 'league' ? 'League' : 'Rotational'}</span>
              </div>
              {booking.locationUrl && (
                <a
                  href={booking.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline text-sm"
                >
                  📍 View Location
                </a>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                booking.status === 'open' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30' :
                booking.status === 'allocating' ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30' :
                booking.status === 'in-progress' ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30' :
                'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)] border border-[var(--color-text-muted)]/30'
              }`}>
                {booking.status}
              </span>
              {isOwner && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] rounded-lg transition-all"
                  title="Room Settings"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'players'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Players ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'teams'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Teams ({teams.length})
          </button>
          {booking.playMode === 'league' && (
            <button
              onClick={() => setActiveTab('league')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'league'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              League
            </button>
          )}
          {booking.playMode === 'rotational' && (
            <button
              onClick={() => setActiveTab('rotational')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'rotational'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Rotation
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'players' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Add Player Form */}
            <div className="lg:col-span-1">
              <AddPlayerForm
                onAddPlayer={handleAddPlayer}
                isLoggedIn={!!firebaseUser}
                userName={userData?.displayName}
              />
            </div>

            {/* Active Players */}
            <div className="lg:col-span-1">
              <BookingList
                players={activePlayers}
                capacity={booking.acceptedCapacity}
                currentUserId={firebaseUser?.uid || null}
                onRemovePlayer={handleRemovePlayer}
                canRemove={(player) => canRemovePlayer(player, firebaseUser?.uid || null) || isOwner}
              />
            </div>

            {/* Waiting List */}
            <div className="lg:col-span-1">
              <WaitingList
                players={waitingPlayers}
                currentUserId={firebaseUser?.uid || null}
                onRemovePlayer={handleRemovePlayer}
                canRemove={(player) => canRemovePlayer(player, firebaseUser?.uid || null) || isOwner}
              />
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <TeamAllocation
            booking={booking}
            players={activePlayers}
            waitingPlayers={waitingPlayers}
            teams={teams}
            isAdmin={isOwner}
            onCreateTeams={handleCreateTeams}
            onRecreateTeams={handleRecreateTeams}
            onRandomAllocate={handleRandomAllocate}
            onFullRandomAllocate={handleFullRandomAllocate}
            onAssignToTeam={handleAssignToTeam}
            onGenerateMatches={handleGenerateMatches}
            onUpdateSettings={async (data) => {
              if (booking) {
                await updateBookingWithCapacityCheck(booking.id, data, {
                  acceptedCapacity: booking.acceptedCapacity,
                  numTeams: booking.numTeams,
                  playersPerTeam: booking.playersPerTeam
                });
              }
            }}
          />
        )}

        {activeTab === 'league' && booking.playMode === 'league' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <LeagueTable standings={standings} />
            <MatchSchedule
              matches={matches}
              teams={teams}
              isAdmin={isOwner}
              onUpdateResult={handleUpdateMatchResult}
            />
          </div>
        )}

        {activeTab === 'rotational' && booking.playMode === 'rotational' && (
          <RotationalView
            booking={booking}
            teams={teams}
            players={activePlayers}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && booking && (
        <RoomSettings
          booking={booking}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default BookingView;

