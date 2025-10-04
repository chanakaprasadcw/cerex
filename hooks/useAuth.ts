import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from '../types';
import { ActivityAction, UserRole } from '../types';
import { logActivity } from '../services/activityLogger';

// A helper to map Firebase error codes to user-friendly messages
const getFriendlyErrorMessage = (error: any): string => {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'The email address is not valid.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email address.';
        case 'auth/weak-password':
            return 'The password is too weak. Please use at least 6 characters.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};


export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loggedInThisSession = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = { uid: firebaseUser.uid, ...userDoc.data() } as User;

              // Super Admin override
              if (userData.email === 'admini@cerex.ae') {
                userData.role = UserRole.SUPER_ADMIN;
              }

              setCurrentUser(userData);
              if (!loggedInThisSession) {
                  await logActivity(userData, ActivityAction.USER_LOGIN, {});
                  loggedInThisSession = true;
              }
            } else {
              console.error("No user document found in Firestore for UID:", firebaseUser.uid);
              await signOut(auth); // Sign out user if their DB record is missing
              setCurrentUser(null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            await signOut(auth);
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        loggedInThisSession = false;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signUp = useCallback(async (email, password, username, role) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          username: username,
          role: role,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {email: newUser.email, username: newUser.username, role: newUser.role});
        await logActivity(newUser, ActivityAction.USER_REGISTERED, { registeredAs: role });
        // onAuthStateChanged will handle setting the currentUser state automatically
    } catch (error) {
        throw new Error(getFriendlyErrorMessage(error));
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle setting the currentUser state automatically
    } catch (error) {
        throw new Error(getFriendlyErrorMessage(error));
    }
  }, []);
  
  const logOut = useCallback(async () => {
    try {
        if (currentUser) {
            await logActivity(currentUser, ActivityAction.USER_LOGOUT, {});
        }
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw new Error(getFriendlyErrorMessage(error));
    }
  }, [currentUser]);
  
  const resetPassword = useCallback(async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw new Error(getFriendlyErrorMessage(error));
    }
  }, []);

  return { currentUser, loading, signUp, signIn, logOut, resetPassword };
};