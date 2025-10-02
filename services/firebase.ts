import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: IMPORTANT - To fix the connection timeout error, you must set up Firestore
// in your Firebase project console. Please do the following:
// 1. Go to your Firebase project: https://console.firebase.google.com/
// 2. In the left-hand "Build" menu, click on "Firestore Database".
// 3. Click the "Create database" button.
// 4. For development, select "Start in test mode" and choose a server location.
//    "Test mode" allows anyone to read/write to your database for 30 days.
// 5. Click "Enable".
// Your app should now be able to connect to the database.

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIDqCG1xW712MHJa9mHrWWDt4SQ5sSEzA",
  authDomain: "cerextest.firebaseapp.com",
  projectId: "cerextest",
  storageBucket: "cerextest.firebasestorage.app",
  messagingSenderId: "919205506897",
  appId: "1:919205506897:web:24b37722a5e8eeec246d70",
  measurementId: "G-4WZHNSMHPH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
