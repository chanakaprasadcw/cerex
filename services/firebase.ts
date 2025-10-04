// services/firebase.ts
// FIX: Corrected the Firebase import to use the named export 'initializeApp' as required by the modular SDK (v9+). The previous default import was causing a module resolution error at runtime.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCIDqCG1xW712MHJa9mHrWWDt4SQ5sSEzA",
  authDomain: "cerextest.firebaseapp.com",
  projectId: "cerextest",
  storageBucket: "cerextest.appspot.com",
  messagingSenderId: "919205506897",
  appId: "1:919205506897:web:24b37722a5e8eeec246d70",
  measurementId: "G-4WZHNSMHPH",
};

const app = initializeApp(firebaseConfig);

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);