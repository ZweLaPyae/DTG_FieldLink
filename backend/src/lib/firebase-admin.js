// backend/src/lib/firebase-admin.js
// Centralized Firebase Admin SDK initialization

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseAdmin = null;

/**
 * Initialize Firebase Admin SDK (singleton)
 */
export function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    // ✅ 1. Use ENV variables (Production)
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

      console.log('✅ Firebase Admin initialized using ENV');
      return firebaseAdmin;
    }

    // ✅ 2. Fallback to local JSON (Development)
    const serviceAccountPath = path.join(
      __dirname,
      '../../firebase-service-account.json'
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8')
      );

      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin initialized using local JSON');
      return firebaseAdmin;
    }

    console.warn('⚠️ Firebase credentials not found');
    return null;

  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    return null;
  }
}

/**
 * Create a Firebase Auth user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<Object>} Created user record
 */
export async function createFirebaseUser(email, password, displayName) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Skipping Firebase user creation.');
    return null;
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false, // Can be set to true if you trust the email
    });

    console.log(`✅ Created Firebase user: ${email} (UID: ${userRecord.uid})`);
    return userRecord;
  } catch (error) {
    // Handle case where user already exists
    if (error.code === 'auth/email-already-exists') {
      console.log(`ℹ️  Firebase user already exists: ${email}`);
      
      // Try to update the password instead
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(existingUser.uid, {
          password: password,
          displayName: displayName,
        });
        console.log(`✅ Updated existing Firebase user: ${email}`);
        return existingUser;
      } catch (updateError) {
        console.error(`❌ Failed to update Firebase user ${email}:`, updateError.message);
        throw updateError;
      }
    } else {
      console.error(`❌ Failed to create Firebase user ${email}:`, error.message);
      throw error;
    }
  }
}

/**
 * Delete a Firebase Auth user by email
 * @param {string} email - User email
 */
export async function deleteFirebaseUser(email) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Skipping Firebase user deletion.');
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
    console.log(`✅ Deleted Firebase user: ${email}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️  Firebase user not found: ${email}`);
    } else {
      console.error(`❌ Failed to delete Firebase user ${email}:`, error.message);
      throw error;
    }
  }
}

export default { getFirebaseAdmin, createFirebaseUser, deleteFirebaseUser };
