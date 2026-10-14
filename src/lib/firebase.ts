import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCukFvVJFqEkHmO-xWUbZ25uuRpLQ2J1aY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'eb5proj.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://eb5proj-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'eb5proj',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'eb5proj.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '646911734716',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:646911734716:web:13d9f563089dc24570f1b9',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-PX07Q5N7X4',
}

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)

export default app
