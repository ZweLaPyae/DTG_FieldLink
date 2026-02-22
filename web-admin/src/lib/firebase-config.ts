// web-admin/src/lib/firebase-config.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

// Firebase configuration - using environment variables for better management
// Note: These are PUBLIC client identifiers, not secrets
// They're safe to expose in client-side code
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDVz6MPkTPwZXVke4Btb2DKsTo4lUWJe78",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dtg-fieldlink-71872.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dtg-fieldlink-71872",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dtg-fieldlink-71872.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "107877922405361975376",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:24358994999:web:5fe0cdba3a3aaa4a73ebb2"
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized for web-admin');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      return null;
    }
  }

  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  if (!messaging && app) {
    try {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');
    } catch (error) {
      console.error('❌ Firebase Messaging initialization error:', error);
      return null;
    }
  }

  return messaging;
}
