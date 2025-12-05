import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Team, Player } from '../types';

// Create teams for a booking
export const createTeams = async (
  bookingId: string,
  numTeams: number
): Promise<string[]> => {
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const teamIds: string[] = [];
  
  for (let i = 1; i <= numTeams; i++) {
    const docRef = await addDoc(teamsRef, {
      teamName: `Team ${i}`,
      players: [],
      createdAt: serverTimestamp()
    });
    teamIds.push(docRef.id);
  }
  
  return teamIds;
};

// Get teams for a booking
export const getTeamsForBooking = async (bookingId: string): Promise<Team[]> => {
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const snapshot = await getDocs(teamsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Team[];
};

// Subscribe to teams for a booking
export const subscribeToTeams = (
  bookingId: string,
  callback: (teams: Team[]) => void
) => {
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  
  return onSnapshot(teamsRef, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];
    callback(teams);
  });
};

// Assign player to team
export const assignPlayerToTeam = async (
  bookingId: string,
  playerId: string,
  teamId: string
): Promise<void> => {
  // Update player's teamId
  const playerRef = doc(db, 'bookings', bookingId, 'players', playerId);
  await updateDoc(playerRef, { teamId });
  
  // Update team's players array
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);
  
  const batch = writeBatch(db);
  
  // Remove player from any existing team
  teamsSnapshot.docs.forEach(teamDoc => {
    const teamData = teamDoc.data();
    if (teamData.players.includes(playerId)) {
      batch.update(teamDoc.ref, {
        players: teamData.players.filter((p: string) => p !== playerId)
      });
    }
  });
  
  // Add player to new team
  const targetTeam = teamsSnapshot.docs.find(t => t.id === teamId);
  if (targetTeam) {
    const teamData = targetTeam.data();
    if (!teamData.players.includes(playerId)) {
      batch.update(targetTeam.ref, {
        players: [...teamData.players, playerId]
      });
    }
  }
  
  await batch.commit();
};

// Remove player from team
export const removePlayerFromTeam = async (
  bookingId: string,
  playerId: string
): Promise<void> => {
  // Update player's teamId
  const playerRef = doc(db, 'bookings', bookingId, 'players', playerId);
  await updateDoc(playerRef, { teamId: null });
  
  // Remove from team's players array
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);
  
  const batch = writeBatch(db);
  
  teamsSnapshot.docs.forEach(teamDoc => {
    const teamData = teamDoc.data();
    if (teamData.players.includes(playerId)) {
      batch.update(teamDoc.ref, {
        players: teamData.players.filter((p: string) => p !== playerId)
      });
    }
  });
  
  await batch.commit();
};

// Randomly allocate unassigned players to teams (sequential fill)
// Fills Team 1 to capacity, then Team 2, etc.
export const randomlyAllocatePlayers = async (
  bookingId: string,
  players: Player[],
  teams: Team[],
  playersPerTeam: number
): Promise<void> => {
  // Get unassigned active players
  const unassignedPlayers = players.filter(
    p => p.status === 'active' && !p.teamId
  );
  
  // Shuffle players
  const shuffled = [...unassignedPlayers].sort(() => Math.random() - 0.5);
  
  // Sort teams by name to ensure consistent order (Team 1, Team 2, etc.)
  const sortedTeams = [...teams].sort((a, b) => a.teamName.localeCompare(b.teamName));
  
  // Calculate current team sizes
  const teamSizes = new Map<string, number>();
  sortedTeams.forEach(team => {
    teamSizes.set(team.id, team.players.length);
  });
  
  const batch = writeBatch(db);
  let playerIndex = 0;
  
  // Fill teams sequentially - fill each team to capacity before moving to next
  for (const team of sortedTeams) {
    const currentSize = teamSizes.get(team.id) || 0;
    const spotsToFill = playersPerTeam - currentSize;
    
    for (let i = 0; i < spotsToFill && playerIndex < shuffled.length; i++) {
      const player = shuffled[playerIndex];
      const playerRef = doc(db, 'bookings', bookingId, 'players', player.id);
      batch.update(playerRef, { teamId: team.id });
      playerIndex++;
    }
  }
  
  await batch.commit();
  
  // Rebuild team players arrays
  await rebuildTeamPlayers(bookingId);
};

// Rebuild team players arrays from player documents
const rebuildTeamPlayers = async (bookingId: string): Promise<void> => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  
  const [playersSnapshot, teamsSnapshot] = await Promise.all([
    getDocs(playersRef),
    getDocs(teamsRef)
  ]);
  
  // Group players by team
  const playersByTeam = new Map<string, string[]>();
  teamsSnapshot.docs.forEach(team => {
    playersByTeam.set(team.id, []);
  });
  
  playersSnapshot.docs.forEach(playerDoc => {
    const player = playerDoc.data();
    if (player.teamId && playersByTeam.has(player.teamId)) {
      playersByTeam.get(player.teamId)!.push(playerDoc.id);
    }
  });
  
  // Update teams
  const batch = writeBatch(db);
  teamsSnapshot.docs.forEach(teamDoc => {
    batch.update(teamDoc.ref, {
      players: playersByTeam.get(teamDoc.id) || []
    });
  });
  
  await batch.commit();
};

// Fully random allocation (clear all and reassign)
// Fills teams sequentially - Team 1 to capacity, then Team 2, etc.
export const fullyRandomAllocate = async (
  bookingId: string,
  players: Player[],
  teams: Team[],
  playersPerTeam: number,
  pullFromWaitingList: boolean = false
): Promise<void> => {
  // Get all players who can be allocated
  let eligiblePlayers = players.filter(p => p.status === 'active');
  
  // If pulling from waiting list, also include waiting players
  if (pullFromWaitingList) {
    const waitingPlayers = players
      .filter(p => p.status === 'waiting')
      .sort((a, b) => a.position - b.position);
    eligiblePlayers = [...eligiblePlayers, ...waitingPlayers];
  }
  
  // Shuffle active players
  const shuffled = [...eligiblePlayers].sort(() => Math.random() - 0.5);
  
  // Sort teams by name to ensure consistent order (Team 1, Team 2, etc.)
  const sortedTeams = [...teams].sort((a, b) => a.teamName.localeCompare(b.teamName));
  
  // Calculate total spots needed
  const totalSpots = sortedTeams.length * playersPerTeam;
  const playersToAssign = shuffled.slice(0, totalSpots);
  
  const batch = writeBatch(db);
  
  // Clear all existing assignments first
  players.forEach(player => {
    const playerRef = doc(db, 'bookings', bookingId, 'players', player.id);
    batch.update(playerRef, { teamId: null });
  });
  
  teams.forEach(team => {
    const teamRef = doc(db, 'bookings', bookingId, 'teams', team.id);
    batch.update(teamRef, { players: [] });
  });
  
  // Assign players sequentially to teams
  let playerIndex = 0;
  for (const team of sortedTeams) {
    for (let i = 0; i < playersPerTeam && playerIndex < playersToAssign.length; i++) {
      const player = playersToAssign[playerIndex];
      const playerRef = doc(db, 'bookings', bookingId, 'players', player.id);
      batch.update(playerRef, { 
        teamId: team.id,
        // If player was waiting and we're pulling them in, make them active
        ...(player.status === 'waiting' ? { status: 'active' } : {})
      });
      playerIndex++;
    }
  }
  
  await batch.commit();
  
  // Rebuild team players arrays
  await rebuildTeamPlayers(bookingId);
};

// Update team name
export const updateTeamName = async (
  bookingId: string,
  teamId: string,
  teamName: string
): Promise<void> => {
  const teamRef = doc(db, 'bookings', bookingId, 'teams', teamId);
  await updateDoc(teamRef, { teamName });
};

// Delete all teams and clear player team assignments
export const deleteAllTeams = async (bookingId: string): Promise<void> => {
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  
  const [teamsSnapshot, playersSnapshot] = await Promise.all([
    getDocs(teamsRef),
    getDocs(playersRef)
  ]);
  
  const batch = writeBatch(db);
  
  // Delete all teams
  teamsSnapshot.docs.forEach(teamDoc => {
    batch.delete(teamDoc.ref);
  });
  
  // Clear team assignments from all players
  playersSnapshot.docs.forEach(playerDoc => {
    if (playerDoc.data().teamId) {
      batch.update(playerDoc.ref, { teamId: null });
    }
  });
  
  await batch.commit();
};

// Recreate teams with new count (delete old teams and create new ones)
export const recreateTeams = async (
  bookingId: string,
  numTeams: number
): Promise<string[]> => {
  // First delete all existing teams
  await deleteAllTeams(bookingId);
  
  // Then create new teams
  return createTeams(bookingId, numTeams);
};

