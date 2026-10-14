import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAr40FYKxv4rwEV86QQAJUkwQtzaGIW2wI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'chatbot-ebcc2.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://chatbot-ebcc2-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'chatbot-ebcc2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'chatbot-ebcc2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '388950429059',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:388950429059:web:04692c8f8f96e060d6bab6',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-X0ZN4YV7VK',
}

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)

export default app
