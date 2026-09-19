import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAj_9HwDlzLrCzQIjjNORbmShHE_s9ufb4",
  authDomain: "amarstore-e6a3f.firebaseapp.com",
  projectId: "amarstore-e6a3f",
  storageBucket: "amarstore-e6a3f.firebasestorage.app",
  messagingSenderId: "390031961658",
  appId: "1:390031961658:web:749a0384f04c36223bcf03"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
