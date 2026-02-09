// backend/test-firebase-integration.js
// Quick test to verify Firebase Admin integration
// Run: node test-firebase-integration.js

import { createFirebaseUser, getFirebaseAdmin } from './src/lib/firebase-admin.js';

async function testFirebaseIntegration() {
  console.log('🧪 Testing Firebase Admin Integration...\n');

  // Test 1: Check if Firebase Admin can initialize
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.error('❌ Firebase Admin SDK failed to initialize');
    console.error('⚠️  Make sure firebase-service-account.json exists in backend/');
    process.exit(1);
  }
  console.log('✅ Firebase Admin SDK initialized successfully\n');

  // Test 2: Try creating a test user
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'DTG1234';
  const testName = 'Test User';

  console.log(`🔧 Creating test Firebase user:`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log(`   Name: ${testName}\n`);

  try {
    const userRecord = await createFirebaseUser(testEmail, testPassword, testName);
    console.log('✅ Test user created successfully!');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}\n`);

    // Clean up - delete the test user
    console.log('🧹 Cleaning up test user...');
    await admin.auth().deleteUser(userRecord.uid);
    console.log('✅ Test user deleted\n');

    console.log('🎉 All tests passed!');
    console.log('\n✅ Firebase integration is working correctly.');
    console.log('✅ When admin creates technicians, Firebase users will be created automatically.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testFirebaseIntegration();
