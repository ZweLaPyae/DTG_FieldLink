# Firebase Authentication Setup Guide

## Prerequisites
- Firebase account (https://console.firebase.google.com)
- Flutter app configured for Android/iOS

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: `DTG-FieldLink` (or your preferred name)
4. Disable Google Analytics (optional) or enable it
5. Click "Create project"

## Step 2: Add Android App to Firebase

⚠️ **CRITICAL: Package Name MUST Match**

1. In Firebase Console, click the Android icon  
2. **Enter Android package name**: `com.dtg.fieldlink`
   - ✅ Use: `com.dtg.fieldlink` (correct)
   - ❌ Don't use: `com.example.mobile_app` (default Flutter, wrong!)
   - Find the correct package in `mobile_app/android/app/build.gradle.kts` under `applicationId`
3. Download `google-services.json`  
4. Replace the file at: `mobile_app/android/app/google-services.json`

**Why this matters**: The package name in Firebase MUST exactly match `applicationId` in build.gradle.kts, or the build will fail with "No matching client found" error.

## Step 3: Add iOS App to Firebase (Optional)

1. In Firebase Console, click the iOS icon
2. Enter iOS bundle ID (found in Xcode project)
3. Download `GoogleService-Info.plist`
4. Place in `mobile_app/ios/Runner/GoogleService-Info.plist`

## Step 4: Enable Authentication Methods

1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable **Email/Password** authentication
3. Click "Save"

## Step 5: Configure Firebase in Code

### Files that need Firebase configuration:

#### `mobile_app/lib/config/firebase_config.dart`
```dart
// TODO: Update these values after Firebase setup
static const String firebaseProjectId = 'YOUR_PROJECT_ID'; // From Firebase Console
static const String firebaseApiKey = 'YOUR_API_KEY'; // From google-services.json
```

#### `mobile_app/android/app/build.gradle`
Already configured. Just ensure `google-services.json` is in place.

## Step 6: Create User Accounts in Firebase

### Option A: Via Firebase Console
1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. **IMPORTANT**: The email should match the technician's email in your database

### Option B: Via Code (Programmatic)
Use the backend migration script (see below)

## Step 7: Run Backend Migration Script

To sync existing technicians with Firebase:

```bash
cd backend
node src/scripts/sync-firebase-users.js
```

This will:
- Read all technicians from database
- Create Firebase accounts for them
- Use their existing emails
- Set default password: `DTG{last4digits}` (same as current system)

## Step 8: Test Authentication

1. Run the mobile app
2. Try logging in with:
   - Email: technician's email from database
   - Password: `DTG{last4digits}` (e.g., `DTG1234` if phone ends with 1234)

## What Won't Work Without Proper Setup:

### Without `google-services.json`:
- ❌ App will crash on startup
- ❌ Error: "Default FirebaseApp is not initialized"

### Without enabling Email/Password in Firebase Console:
- ❌ Login will fail with error
- ❌ Error: "This operation is not allowed"

### Without creating Firebase users:
- ❌ Login will fail even with correct credentials
- ❌ Error: "There is no user record corresponding to this identifier"

## Security Rules

### Firestore (if you add it later):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Error: "No matching client found for package name"
**Most Common Issue!**

Full error:
```
No matching client found for package name 'com.example.mobile_app' 
in google-services.json
```

**Cause**: You registered the Android app in Firebase Console with the wrong package name.

**Solution**:
1. Go to Firebase Console → Project Settings → Your apps
2. Delete the Android app with wrong package name  
3. Click "Add app" → Android
4. **Use correct package**: `com.dtg.fieldlink`
5. Download new google-services.json
6. Replace file in `mobile_app/android/app/google-services.json`
7. Run: `flutter clean && flutter run`

### Error: "Default FirebaseApp is not initialized"
- Check `google-services.json` is in correct location
- Rebuild the app: `flutter clean && flutter pub get && flutter run`
- Verify Google Services plugin is enabled in `android/app/build.gradle.kts`

### Error: "There is no user record"
- User doesn't exist in Firebase Authentication
- Create user via Console or run migration script  

### Error: "The email address is badly formatted"
- Ensure technician has valid email in database
- Update database with valid emails

## Cost Considerations

Firebase Free Tier includes:
- 50,000 MAU (Monthly Active Users) for Authentication
- Unlimited email/password sign-ins
- Should be sufficient for field technician app

## Next Steps

After Firebase is working:
1. Consider adding password reset functionality
2. Add email verification (optional)
3. Implement role-based access control
4. Add Firebase Cloud Messaging for push notifications
