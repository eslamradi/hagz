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

export const generateBookingCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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

export const getBookingByCode = async (code: string): Promise<Booking | null> => {
  const q = query(collection(db, 'bookings'), where('code', '==', code.toUpperCase()));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Booking;
  }
  return null;
};

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

export const updateBooking = async (
  bookingId: string,
  data: Partial<Omit<Booking, 'id' | 'code' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  await updateDoc(doc(db, 'bookings', bookingId), data);
};

export const deleteBooking = async (bookingId: string): Promise<void> => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const playersSnapshot = await getDocs(playersRef);
  
  const batch = writeBatch(db);
  playersSnapshot.docs.forEach(playerDoc => {
    batch.delete(playerDoc.ref);
  });
  
  const teamsRef = collection(db, 'bookings', bookingId, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);
  teamsSnapshot.docs.forEach(teamDoc => {
    batch.delete(teamDoc.ref);
  });
  
  const matchesRef = collection(db, 'bookings', bookingId, 'matches');
  const matchesSnapshot = await getDocs(matchesRef);
  matchesSnapshot.docs.forEach(matchDoc => {
    batch.delete(matchDoc.ref);
  });
  
  await batch.commit();
  await deleteDoc(doc(db, 'bookings', bookingId));
};

export const addPlayerToBooking = async (
  bookingId: string,
  playerData: {
    playerName: string;
    addedBy: string | null;
    userId: string | null;
  }
): Promise<string> => {
  const playersRef = collection(db, 'bookings', bookingId, 'players');
  const playersSnapshot = await getDocs(playersRef);
  const position = playersSnapshot.size + 1;
  
  const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
  if (!bookingDoc.exists()) throw new Error('Booking not found');
  
  const booking = bookingDoc.data() as Booking;
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

export const removePlayerFromBooking = async (
  bookingId: string,
  playerId: string
): Promise<void> => {
  const playerRef = doc(db, 'bookings', bookingId, 'players', playerId);
  const playerSnap = await getDoc(playerRef);
  
  if (!playerSnap.exists()) return;
  
  const removedPlayer = playerSnap.data() as Player;
  const wasActive = removedPlayer.status === 'active';
  
  await deleteDoc(playerRef);
  
  if (wasActive) {
    const playersRef = collection(db, 'bookings', bookingId, 'players');
    const q = query(
      playersRef,
      where('status', '==', 'waiting'),
      orderBy('position', 'asc')
    );
    
    const waitingSnapshot = await getDocs(q);
    
    if (!waitingSnapshot.empty) {
      const firstWaiting = waitingSnapshot.docs[0];
      await updateDoc(firstWaiting.ref, { status: 'active' });
    }
  }
};

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

export const canRemovePlayer = (
  player: Player,
  currentUserId: string | null
): boolean => {
  if (!currentUserId) return false;
  return player.addedBy === currentUserId || player.userId === currentUserId;
};





