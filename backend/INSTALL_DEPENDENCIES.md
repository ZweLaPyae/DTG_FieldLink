# Backend Dependencies for Firebase & DO Spaces

You need to install these npm packages in the backend:

```bash
cd backend
npm install aws-sdk firebase-admin dotenv
```

## Package Descriptions:

- **aws-sdk**: AWS SDK for JavaScript (works with DigitalOcean Spaces S3-compatible API)
- **firebase-admin**: Firebase Admin SDK for server-side operations (user management, auth)
- **dotenv**: Already installed, but needed for loading .env variables

## After Installing:

1. Update your `backend/.env` file with the values from `.env.example`
2. Download `firebase-service-account.json` from Firebase Console
3. Place it in the `backend/` directory
4. Run the user sync script: `node src/scripts/sync-firebase-users.js`

## ⚠️ Without These Packages:

- Upload endpoints will fail with "Cannot find module 'aws-sdk'"
- Firebase sync script will fail with "Cannot find module 'firebase-admin'"
- Server won't start if import statements fail
