import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

const googleProvider = new GoogleAuthProvider();

export const signUp = async (email: string, password: string, displayName: string): Promise<FirebaseUser> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  
  await updateProfile(user, { displayName });
  
  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    createdAt: serverTimestamp()
  });
  
  return user;
};

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  const { user } = await signInWithPopup(auth, googleProvider);
  
  // Check if user document exists, if not create it
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      createdAt: serverTimestamp()
    });
  }
  
  return user;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserData = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data() as User;
  }
  return null;
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

