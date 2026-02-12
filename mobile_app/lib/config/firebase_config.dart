// lib/config/firebase_config.dart
// Firebase Authentication Configuration

class FirebaseConfig {
  // ✅ SECURITY NOTE: These values are SAFE to expose publicly
  // These are CLIENT-SIDE keys meant to be embedded in mobile apps
  // They're also visible in android/app/google-services.json
  // Firebase security rules protect your data, not these keys
  
  // Firebase Project ID (Public - safe to share)
  // Find this in Firebase Console > Project Settings > General
  static const String firebaseProjectId = 'dtg-fieldlink-71872';
  
  // Firebase API Key (Public - safe to share)
  // This is a CLIENT key, not the admin SDK key
  // Find this in google-services.json under "api_key" > "current_key"
  static const String firebaseApiKey = 'AIzaSyDVz6MPkTPwZXVke4Btb2DKsTo4lUWJe78';
  
  // ⚠️ IMPORTANT: The SECRET credentials are in backend/firebase-service-account.json
  // That file has admin access and must NEVER be committed to git or exposed
  
  // Firebase configuration check
  static bool get isConfigured {
    return firebaseProjectId != 'YOUR_PROJECT_ID' && 
           firebaseApiKey != 'YOUR_API_KEY';
  }
  
  // ⚠️ WITHOUT PROPER CONFIGURATION:
  // - App will crash on startup
  // - You'll see error: "Default FirebaseApp is not initialized"
  // - Login will not work
  
  // NEXT STEPS:
  // 1. Set up Firebase project in Firebase Console
  // 2. Download google-services.json
  // 3. Place in android/app/ directory
  // 4. Update values above
  // 5. Run: flutter pub get
  // 6. Run: flutter run
}
