// backend/src/lib/firebase-admin.js
// Centralized Firebase Admin SDK initialization (ENV + Local fallback)

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseAdmin = null;

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 */
export function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // ================================
    // ✅ 1. Try Environment Variables (Production)
    // ================================
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });

      console.log('✅ Firebase Admin initialized using ENV variables');
      return firebaseAdmin;
    }

    // ================================
    // ✅ 2. Fallback to Local JSON (Development)
    // ================================
    const serviceAccountPath = path.join(
      __dirname,
      '../../firebase-service-account.json'
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);

      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin initialized using local JSON file');
      return firebaseAdmin;
    }

    // ================================
    // ❌ If neither exists
    // ================================
    console.warn('⚠️ Firebase Admin credentials not found.');
    console.warn('⚠️ Provide ENV variables or firebase-service-account.json');
    return null;

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
}