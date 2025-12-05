import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Match, Team, LeagueStanding } from '../types';

// Generate round-robin matches
export const generateRoundRobinMatches = async (
  bookingId: string,
  teams: Team[]
): Promise<void> => {
  const matchesRef = collection(db, 'bookings', bookingId, 'matches');
  
  // Clear existing matches
  const existingMatches = await getDocs(matchesRef);
  const batch = writeBatch(db);
  existingMatches.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  
  // Generate all pairings using round-robin algorithm
  const teamIds = teams.map(t => t.id);
  const n = teamIds.length;
  
  if (n < 2) return;
  
  // If odd number of teams, add a "bye"
  const teamsForSchedule = n % 2 === 0 ? [...teamIds] : [...teamIds, 'bye'];
  const numTeams = teamsForSchedule.length;
  const rounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  
  let order = 0;
  
  for (let round = 0; round < rounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (numTeams - 1);
      let away = (numTeams - 1 - match + round) % (numTeams - 1);
      
      // Last team stays fixed, others rotate
      if (match === 0) {
        away = numTeams - 1;
      }
      
      const team1Id = teamsForSchedule[home];
      const team2Id = teamsForSchedule[away];
      
      // Skip bye matches
      if (team1Id === 'bye' || team2Id === 'bye') continue;
      
      await addDoc(matchesRef, {
        team1Id,
        team2Id,
        status: 'scheduled',
        team1Score: null,
        team2Score: null,
        round: round + 1,
        order: ++order,
        createdAt: serverTimestamp()
      });
    }
  }
};

// Get matches for a booking
export const getMatchesForBooking = async (bookingId: string): Promise<Match[]> => {
  const matchesRef = collection(db, 'bookings', bookingId, 'matches');
  const q = query(matchesRef, orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Match[];
};

// Subscribe to matches for a booking
export const subscribeToMatches = (
  bookingId: string,
  callback: (matches: Match[]) => void
) => {
  const matchesRef = collection(db, 'bookings', bookingId, 'matches');
  const q = query(matchesRef, orderBy('order', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Match[];
    callback(matches);
  });
};

// Update match result
export const updateMatchResult = async (
  bookingId: string,
  matchId: string,
  team1Score: number,
  team2Score: number
): Promise<void> => {
  const matchRef = doc(db, 'bookings', bookingId, 'matches', matchId);
  await updateDoc(matchRef, {
    team1Score,
    team2Score,
    status: 'completed'
  });
};

// Clear match result
export const clearMatchResult = async (
  bookingId: string,
  matchId: string
): Promise<void> => {
  const matchRef = doc(db, 'bookings', bookingId, 'matches', matchId);
  await updateDoc(matchRef, {
    team1Score: null,
    team2Score: null,
    status: 'scheduled'
  });
};

// Calculate league standings
export const calculateLeagueStandings = (
  teams: Team[],
  matches: Match[]
): LeagueStanding[] => {
  // Initialize standings
  const standings = new Map<string, LeagueStanding>();
  
  teams.forEach(team => {
    standings.set(team.id, {
      teamId: team.id,
      teamName: team.teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
  });
  
  // Process completed matches
  matches.forEach(match => {
    if (match.status !== 'completed' || match.team1Score === null || match.team2Score === null) {
      return;
    }
    
    const team1 = standings.get(match.team1Id);
    const team2 = standings.get(match.team2Id);
    
    if (!team1 || !team2) return;
    
    // Update played
    team1.played++;
    team2.played++;
    
    // Update goals
    team1.goalsFor += match.team1Score;
    team1.goalsAgainst += match.team2Score;
    team2.goalsFor += match.team2Score;
    team2.goalsAgainst += match.team1Score;
    
    // Determine winner and update points
    if (match.team1Score > match.team2Score) {
      team1.won++;
      team1.points += 3;
      team2.lost++;
    } else if (match.team2Score > match.team1Score) {
      team2.won++;
      team2.points += 3;
      team1.lost++;
    } else {
      team1.drawn++;
      team2.drawn++;
      team1.points += 1;
      team2.points += 1;
    }
  });
  
  // Calculate goal difference
  standings.forEach(standing => {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  });
  
  // Sort standings: Points (desc), GD (desc), Goals scored (desc)
  const sorted = Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  
  return sorted;
};

// Swap match order
export const swapMatchOrder = async (
  bookingId: string,
  match1Id: string,
  match2Id: string
): Promise<void> => {
  const matchesRef = collection(db, 'bookings', bookingId, 'matches');
  const [match1Snap, match2Snap] = await Promise.all([
    getDocs(query(matchesRef)),
    getDocs(query(matchesRef))
  ]);
  
  const match1 = match1Snap.docs.find(d => d.id === match1Id);
  const match2 = match2Snap.docs.find(d => d.id === match2Id);
  
  if (!match1 || !match2) return;
  
  const order1 = match1.data().order;
  const order2 = match2.data().order;
  
  const batch = writeBatch(db);
  batch.update(doc(db, 'bookings', bookingId, 'matches', match1Id), { order: order2 });
  batch.update(doc(db, 'bookings', bookingId, 'matches', match2Id), { order: order1 });
  
  await batch.commit();
};

