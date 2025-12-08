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

  useEffect(() => {
    if (teams.length > 0 && matches.length > 0) {
      setStandings(calculateLeagueStandings(teams, matches));
    }
  }, [teams, matches]);

  const activePlayers = players.filter(p => p.status === 'active');
  const waitingPlayers = players.filter(p => p.status === 'waiting');
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
      const allPlayers = pullFromWaitingList ? players : activePlayers;
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
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return 'bg-[#e6f4ea] text-[var(--color-success)]';
      case 'allocating': return 'bg-[#fef3e2] text-[var(--color-warning)]';
      case 'in-progress': return 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]';
      default: return 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fce8e6] rounded-full mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
            {error || 'Booking Not Found'}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            The booking code "{code}" doesn't exist or has been removed.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⚽</span>
              </div>
              <span className="text-xl font-bold text-[var(--color-text)]">7agz</span>
            </Link>

            <div className="flex items-center gap-6">
              <span className="font-mono text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg)] px-4 py-2 rounded-lg tracking-wider">
                {booking.code}
              </span>
              {firebaseUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold">
                    {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-[var(--color-text)] font-medium hidden sm:block">{userData?.displayName}</span>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center !px-6 !py-3 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all min-h-[44px] min-w-[100px]"
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
        {/* Booking Info Card */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] mb-8 overflow-hidden animate-fade-in">
          <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]" />
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    {booking.description || 'Football Match'}
                  </h1>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize ${getStatusBadge(booking.status)}`}>
                    {booking.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(booking.playDate)}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {activePlayers.length}/{booking.acceptedCapacity} players
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {booking.numTeams} teams · {booking.playMode === 'league' ? 'League' : 'Rotational'}
                  </span>
                </div>
                {booking.locationUrl && (
                  <a
                    href={booking.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline text-sm font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View Location
                  </a>
                )}
              </div>

              {isOwner && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-border)] rounded-xl transition-all text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--color-border)] mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('players')}
              className={`pb-4 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === 'players'
                  ? 'border-[var(--color-text)] text-[var(--color-text)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Players ({players.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-4 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === 'teams'
                  ? 'border-[var(--color-text)] text-[var(--color-text)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Teams ({teams.length})
            </button>
            {booking.playMode === 'league' && (
              <button
                onClick={() => setActiveTab('league')}
                className={`pb-4 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === 'league'
                    ? 'border-[var(--color-text)] text-[var(--color-text)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                League
              </button>
            )}
            {booking.playMode === 'rotational' && (
              <button
                onClick={() => setActiveTab('rotational')}
                className={`pb-4 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === 'rotational'
                    ? 'border-[var(--color-text)] text-[var(--color-text)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                Rotation
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'players' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="min-w-0">
              <AddPlayerForm
                onAddPlayer={handleAddPlayer}
                isLoggedIn={!!firebaseUser}
                userName={userData?.displayName}
              />
            </div>
            <div className="min-w-0">
              <BookingList
                players={activePlayers}
                capacity={booking.acceptedCapacity}
                currentUserId={firebaseUser?.uid || null}
                onRemovePlayer={handleRemovePlayer}
                canRemove={(player) => canRemovePlayer(player, firebaseUser?.uid || null) || isOwner}
              />
            </div>
            <div className="min-w-0">
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
          <div className="grid gap-8 lg:grid-cols-2">
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
