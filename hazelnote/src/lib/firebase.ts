import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyASWr6KPOajE6gis-kWkCCTDNmq3GvEyV4",
  authDomain: "hazelnoteai.firebaseapp.com",
  projectId: "hazelnoteai",
  storageBucket: "hazelnoteai.firebasestorage.app",
  messagingSenderId: "892121963498",
  appId: "1:892121963498:web:f73a471bfce70f663c3093"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
