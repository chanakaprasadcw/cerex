import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User, ActivityAction } from '../types';

/**
 * Logs a user activity to the 'activityLog' collection in Firestore.
 * @param user The user performing the action.
 * @param action The type of action performed.
 * @param details An object containing relevant details about the action.
 */
export const logActivity = async (
  user: User,
  action: ActivityAction,
  details: { [key: string]: any }
) => {
  try {
    await addDoc(collection(db, 'activityLog'), {
      timestamp: serverTimestamp(),
      userId: user.uid,
      username: user.username,
      action: action,
      details: details,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};