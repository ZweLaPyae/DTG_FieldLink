// backend/src/scripts/sync-firebase-users.js
// Script to sync existing technicians with Firebase Authentication
// Run this after setting up Firebase to create user accounts

import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const prisma = new PrismaClient();

// TODO: Download service account key from Firebase Console
// Firebase Console > Project Settings > Service Accounts > Generate New Private Key
// Save as: backend/firebase-service-account.json
// ⚠️ NEVER commit this file to Git! Add to .gitignore

// Initialize Firebase Admin SDK (ESM-safe JSON load)
try {
  const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
  const raw = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(raw);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK');
  console.error(error);
  console.error('⚠️  Make sure firebase-service-account.json exists in backend/ directory');
  console.error('⚠️  Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

async function syncFirebaseUsers() {
  try {
    console.log('🔄 Starting Firebase user sync...\n');

    // Fetch all technicians from database
    const technicians = await prisma.technician.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true, // For generating default password
      },
    });

    console.log(`Found ${technicians.length} technicians in database\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const tech of technicians) {
      try {
        // Skip if no email
        if (!tech.email || !tech.email.includes('@')) {
          console.log(`⚠️  Skipped ${tech.name} (ID: ${tech.id}) - Invalid email: ${tech.email}`);
          skipped++;
          continue;
        }

        // Generate password: DTG + last 4 digits of phone
        let password = 'DTG0000'; // Default if no phone
        if (tech.password) {
          // Use existing password if available
          password = tech.password;
        } else if (tech.phone && tech.phone.length >= 4) {
          const last4 = tech.phone.slice(-4);
          password = `DTG${last4}`;
        }

        // Check if user already exists in Firebase
        let firebaseUser;
        try {
          firebaseUser = await admin.auth().getUserByEmail(tech.email);
          
          // User exists, update if needed
          await admin.auth().updateUser(firebaseUser.uid, {
            displayName: tech.name,
            // Can't update password without knowing current password
          });
          
          console.log(`✅ Updated: ${tech.name} (${tech.email})`);
          updated++;
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // User doesn't exist, create new
            firebaseUser = await admin.auth().createUser({
              email: tech.email,
              password: password,
              displayName: tech.name,
              emailVerified: false, // Set to true if you want to skip email verification
            });
            
            console.log(`✅ Created: ${tech.name} (${tech.email}) - Password: ${password}`);
            created++;
          } else {
            throw error;
          }
        }

      } catch (error) {
        console.error(`❌ Error processing ${tech.name}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total: ${technicians.length}`);

    console.log('\n📝 Next Steps:');
    console.log('   1. Test login with email and generated password');
    console.log('   2. Users can reset password via "Forgot Password" if needed');
    console.log('   3. Consider sending welcome emails to technicians');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the sync
syncFirebaseUsers();

// USAGE:
// 1. Download firebase-service-account.json from Firebase Console
// 2. Place in backend/ directory
// 3. Run: node src/scripts/sync-firebase-users.js
//
// ⚠️ WITHOUT firebase-service-account.json:
// - Script will fail immediately
// - Error: "Cannot find module '../../firebase-service-account.json'"
//
// ⚠️ WITHOUT valid service account:
// - Firebase API calls will fail
// - Error: "Service account must be an object"
//
// 📝 SECURITY NOTES:
// - Add firebase-service-account.json to .gitignore
// - Never commit service account key to Git
// - Rotate keys periodically
// - Limit permissions to Authentication only
