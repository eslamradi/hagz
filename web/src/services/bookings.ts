import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Booking, Player } from '../types';

// Generate a unique 6-character code
export const generateBookingCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new booking
export const createBooking = async (data: {
  playDate: Date;
  description: string;
  locationUrl: string;
  acceptedCapacity: number;
  numTeams: number;
  playersPerTeam: number;
  playMode: 'league' | 'rotational';
  createdBy: string;
}): Promise<string> => {
  const code = generateBookingCode();
  
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...data,
    code,
    playDate: Timestamp.fromDate(data.playDate),
    status: 'open',
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

// Get booking by ID
export const getBookingById = async (id: string): Promise<Booking | null> => {
  const docSnap = await getDoc(doc(db, 'bookings', id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  }
  return null;
};

// Get booking by code
export const getBookingByCode = async (code: string): Promise<Booking | null> => {
  const q = query(collection(db, 'bookings'), where('code', '==', code.toUpperCase()));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Booking;
  }
  return null;
};

// Get all bookings
export const getAllBookings = async (): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];
};

// Subscribe to booking changes
export const subscribeToBooking = (
  bookingId: string,
  callback: (booking: Booking | null) => void
) => {
  return onSnapshot(doc(db, 'bookings', bookingId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Booking);
    } else {
      callback(null);
    }
  });
};

// Subscribe to all bookings
export const subscribeToAllBookings = (callback: (bookings: Booking[]) => void) => {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const bookings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Booking[];
    callback(bookings);
  });
};

// Update booking
export const updateBooking = async (
  bookingId: string,
  data: Partial<Omit<Booking, 'id' | 'code' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  await updateDoc(doc(db, 'bookings', bookingId), data);
};

// Delete booking
export const deleteBooking = async (bookingId: string): Promise<void> => {
  // Delete all players in the booking first
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const playersSnapshot = await getDocs(playersRef);
  
  const batch = writeBatch(db);
  playersSnapshot.docs.forEach(playerDoc => {
    batch.delete(playerDoc.ref);
  });
  
  // Delete teams
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);
  teamsSnapshot.docs.forEach(teamDoc => {
    batch.delete(teamDoc.ref);
  });
  
  // Delete matches
  const matchesRef = collection(db, 'bookings', bookingId, 'matches');
  const matchesSnapshot = await getDocs(matchesRef);
  matchesSnapshot.docs.forEach(matchDoc => {
    batch.delete(matchDoc.ref);
  });
  
  await batch.commit();
  
  // Delete the booking itself
  await deleteDoc(doc(db, 'bookings', bookingId));
};

// ============ Player Operations ============

// Add player to booking
export const addPlayerToBooking = async (
  bookingId: string,
  playerData: {
    playerName: string;
    addedBy: string | null;
    userId: string | null;
  }
): Promise<string> => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  
  // Get current players count to determine position
  const playersSnapshot = await getDocs(playersRef);
  const position = playersSnapshot.size + 1;
  
  // Get booking to check capacity
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error('Booking not found');
  
  const activePlayersCount = playersSnapshot.docs.filter(
    doc => doc.data().status === 'active'
  ).length;
  
  const status = activePlayersCount < booking.acceptedCapacity ? 'active' : 'waiting';
  
  const docRef = await addDoc(playersRef, {
    ...playerData,
    addedAt: serverTimestamp(),
    status,
    teamId: null,
    position
  });
  
  return docRef.id;
};

// Remove player from booking and auto-promote waiting player
export const removePlayerFromBooking = async (
  bookingId: string,
  playerId: string
): Promise<void> => {
  const playerRef = doc(db, 'bookings', bookingId, 'players', playerId);
  const playerSnap = await getDoc(playerRef);
  
  if (!playerSnap.exists()) return;
  
  // Get booking to know capacity
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error('Booking not found');
  
  // Delete the player
  await deleteDoc(playerRef);
  
  // Recalculate positions and statuses based on capacity
  // This will automatically promote waiting players and update all positions
  // Calculate effective capacity (min of acceptedCapacity and total team spots)
  const totalSpots = booking.numTeams * booking.playersPerTeam;
  const effectiveCapacity = Math.min(booking.acceptedCapacity, totalSpots);
  
  // This function updates both positions and statuses in one batch
  await recalculatePlayerStatuses(bookingId, effectiveCapacity);
};

// Recalculate positions after removal
const recalculatePositions = async (bookingId: string): Promise<void> => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const q = query(playersRef, orderBy('addedAt', 'asc'));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc, index) => {
    batch.update(doc.ref, { position: index + 1 });
  });
  
  await batch.commit();
};

// Get players for a booking
export const getPlayersForBooking = async (bookingId: string): Promise<Player[]> => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const q = query(playersRef, orderBy('position', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Player[];
};

// Subscribe to players for a booking
export const subscribeToPlayers = (
  bookingId: string,
  callback: (players: Player[]) => void
) => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const q = query(playersRef, orderBy('position', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Player[];
    callback(players);
  });
};

// Check if player can be removed (by adder or self)
export const canRemovePlayer = (
  player: Player,
  currentUserId: string | null
): boolean => {
  if (!currentUserId) return false;
  return player.addedBy === currentUserId || player.userId === currentUserId;
};

// Recalculate player statuses based on new capacity
// When downsizing: players with lowest rank (highest position = joined last) go to waiting
// When upsizing: players from waiting (by position order) get promoted to active
export const recalculatePlayerStatuses = async (
  bookingId: string,
  newCapacity: number
): Promise<void> => {
  try {
    console.log('[recalculatePlayerStatuses] Starting with capacity:', newCapacity);
    
    const playersRef = collection(db, 'bookings', bookingId, 'players');
    
    // Get all players - we'll sort by addedAt in memory to avoid index issues
    const snapshot = await getDocs(playersRef);
    
    console.log('[recalculatePlayerStatuses] Found', snapshot.size, 'players');
    
    if (snapshot.empty) {
      console.log('[recalculatePlayerStatuses] No players found, exiting');
      return;
    }
    
    // Sort players by addedAt timestamp (handle missing addedAt by putting them last)
    const players = snapshot.docs.map(doc => ({
      ref: doc.ref,
      data: doc.data(),
      addedAt: doc.data().addedAt || null
    }));
    
    players.sort((a, b) => {
      // If both have addedAt, compare them
      if (a.addedAt && b.addedAt) {
        const aTime = a.addedAt.toMillis ? a.addedAt.toMillis() : a.addedAt;
        const bTime = b.addedAt.toMillis ? b.addedAt.toMillis() : b.addedAt;
        return aTime - bTime;
      }
      // If only one has addedAt, it comes first
      if (a.addedAt && !b.addedAt) return -1;
      if (!a.addedAt && b.addedAt) return 1;
      // If neither has addedAt, maintain current order
      return 0;
    });
    
    const batch = writeBatch(db);
    const changes: Array<{name: string, oldStatus: string, newStatus: string, position: number}> = [];
    
    // Assign positions and statuses based on signup order
    // Position 1 = first to sign up = highest rank = stays active longest
    // Position N = last to sign up = lowest rank = first to go to waiting when downsizing
    players.forEach((player, index) => {
      const position = index + 1;
      const shouldBeActive = position <= newCapacity;
      const newStatus = shouldBeActive ? 'active' : 'waiting';
      const currentData = player.data;
      const oldStatus = currentData.status || 'waiting';
      
      // Always update position and status
      batch.update(player.ref, { 
        position,
        status: newStatus 
      });
      
      if (oldStatus !== newStatus) {
        changes.push({
          name: currentData.playerName || 'Unknown',
          oldStatus,
          newStatus,
          position
        });
      }
    });
    
    console.log('[recalculatePlayerStatuses] Status changes:', changes);
    console.log('[recalculatePlayerStatuses] Committing batch with', players.length, 'updates');
    
    await batch.commit();
    console.log('[recalculatePlayerStatuses] Batch committed successfully');
  } catch (error) {
    console.error('[recalculatePlayerStatuses] Error:', error);
    throw error;
  }
};

// Update booking and recalculate statuses if capacity or team settings changed
export const updateBookingWithCapacityCheck = async (
  bookingId: string,
  data: Partial<Omit<Booking, 'id' | 'code' | 'createdAt' | 'createdBy'>>,
  currentBooking: { acceptedCapacity: number; numTeams: number; playersPerTeam: number }
): Promise<void> => {
  await updateDoc(doc(db, 'bookings', bookingId), data);
  
  // Calculate effective capacities (total spots = numTeams × playersPerTeam)
  const newNumTeams = data.numTeams ?? currentBooking.numTeams;
  const newPlayersPerTeam = data.playersPerTeam ?? currentBooking.playersPerTeam;
  const newTotalSpots = newNumTeams * newPlayersPerTeam;
  const newAcceptedCapacity = data.acceptedCapacity ?? currentBooking.acceptedCapacity;
  
  // Effective capacity is the minimum of accepted capacity and total team spots
  const newEffectiveCapacity = Math.min(newAcceptedCapacity, newTotalSpots);
  
  console.log('[updateBookingWithCapacityCheck]', {
    currentBooking,
    newData: data,
    newTotalSpots,
    newAcceptedCapacity,
    newEffectiveCapacity
  });
  
  // Always recalculate when any capacity-related setting changes
  const capacitySettingsChanged = 
    data.acceptedCapacity !== undefined ||
    data.numTeams !== undefined ||
    data.playersPerTeam !== undefined;
    
  if (capacitySettingsChanged) {
    console.log('[updateBookingWithCapacityCheck] Recalculating player statuses with capacity:', newEffectiveCapacity);
    await recalculatePlayerStatuses(bookingId, newEffectiveCapacity);
  }
};

