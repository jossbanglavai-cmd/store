import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAuFb9Ed8KgqxdzoT0ZZXCMYFpCzOkNfG4",
  authDomain: "dshop-46653.firebaseapp.com",
  projectId: "dshop-46653",
  storageBucket: "dshop-46653.firebasestorage.app",
  messagingSenderId: "967992598450",
  appId: "1:967992598450:web:f4455afe70e3d2861e0eab"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
