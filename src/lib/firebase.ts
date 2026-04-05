import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { handleAppError } from './utils';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  handleAppError(error, `Firestore ${operationType} on ${path}`);
  throw error;
}

// Helper to get user profile or create if not exists
export async function getOrCreateUserProfile(user: FirebaseUser) {
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const newUser = {
        uid: user.uid,
        displayName: user.displayName || 'Apprenant',
        email: user.email,
        streak: 0,
        lastActive: new Date().toISOString(),
        totalXP: 0,
        totalLessonsCompleted: 0,
        badges: []
      };
      await setDoc(userDocRef, newUser);
      return newUser;
    }
    return userDoc.data();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
  }
}

// Helper to update progress
export async function addXP(userId: string, language: 'French' | 'English', xp: number) {
  const today = new Date().toISOString().split('T')[0];
  const statsDocRef = doc(db, 'users', userId, 'daily_stats', today);
  const userDocRef = doc(db, 'users', userId);

  try {
    // Update daily stats
    const statsDoc = await getDoc(statsDocRef);
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      await updateDoc(statsDocRef, {
        [language === 'French' ? 'xpFrench' : 'xpEnglish']: (data[language === 'French' ? 'xpFrench' : 'xpEnglish'] || 0) + xp,
        lessonsCompleted: (data.lessonsCompleted || 0) + 1
      });
    } else {
      await setDoc(statsDocRef, {
        date: today,
        xpFrench: language === 'French' ? xp : 0,
        xpEnglish: language === 'English' ? xp : 0,
        lessonsCompleted: 1
      });
    }

    // Update user total XP and streak
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastActiveDate = userData.lastActive ? new Date(userData.lastActive).toISOString().split('T')[0] : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = userData.streak || 0;
      if (lastActiveDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastActiveDate !== today || newStreak === 0) {
        newStreak = 1;
      }

      await updateDoc(userDocRef, {
        totalXP: (userData.totalXP || 0) + xp,
        totalLessonsCompleted: (userData.totalLessonsCompleted || 0) + 1,
        streak: newStreak,
        lastActive: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}
