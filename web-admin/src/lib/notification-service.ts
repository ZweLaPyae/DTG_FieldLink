// web-admin/src/lib/notification-service.ts
import { getToken, onMessage, type Messaging } from 'firebase/messaging';
import { initializeFirebase, getFirebaseMessaging } from './firebase-config';

// VAPID Key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Note: This is a PUBLIC key, safe to expose in client-side code
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BDj22T0iqcbq5S-WJiItQTbY8FtcPlavkjqbJBD-5FzHJykYMNNt0IJ0ekCoJlO29qzPRnEQR7NAsqes75Lkx6Q';

let notificationPermissionGranted = false;
let fcmToken: string | null = null;
let isInitializing = false;
let serviceWorkerRegistered = false;

/**
 * Request notification permission and get FCM token
 * @returns FCM token if permission granted, null otherwise
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.warn('⚠️  Cannot request notification permission on server side');
    return null;
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log('⏳ Token request already in progress, waiting...');
    return fcmToken;
  }

  // Return cached token if already obtained
  if (fcmToken) {
    console.log('✅ Using cached FCM token');
    return fcmToken;
  }

  isInitializing = true;

  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('⚠️  This browser does not support notifications');
      return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️  This browser does not support service workers');
      return null;
    }

    // Initialize Firebase
    initializeFirebase();
    const messaging = getFirebaseMessaging();
    
    if (!messaging) {
      console.warn('⚠️  Firebase Messaging not initialized');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('📋 Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('❌ Notification permission denied');
      notificationPermissionGranted = false;
      return null;
    }

    notificationPermissionGranted = true;

    // Register service worker only once
    if (!serviceWorkerRegistered) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registered:', registration);
        serviceWorkerRegistered = true;
        await navigator.serviceWorker.ready;
      } catch (swError) {
        console.error('❌ Service Worker registration failed:', swError);
        return null;
      }
    }

    // Get FCM token with retry logic
    try {
      const swRegistration = await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        console.log('🔑 FCM Token obtained:', token.substring(0, 20) + '...');
        fcmToken = token;
        return token;
      } else {
        console.warn('❌ Failed to get FCM token - no token returned');
        console.warn('💡 This may be due to:');
        console.warn('   1. Running on localhost (FCM has known issues with localhost)');
        console.warn('   2. Invalid VAPID key');
        console.warn('   3. Browser push service unavailable');
        console.warn('   4. Try testing on HTTPS domain or use ngrok/tunnel');
        return null;
      }
    } catch (tokenError: any) {
      console.error('❌ Error getting FCM token:', tokenError);
      console.error('💡 Error details:', {
        name: tokenError.name,
        message: tokenError.message,
        code: tokenError.code
      });
      
      if (tokenError.message?.includes('push service')) {
        console.warn('🔧 Push service error detected. Common causes:');
        console.warn('   1. Localhost environment (use HTTPS domain or tunnel)');
        console.warn('   2. Browser push endpoint unreachable');
        console.warn('   3. Firewall/network blocking FCM servers');
        console.warn('   4. VAPID key mismatch in Firebase Console');
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Register FCM token with backend
 * @param adminUserId - Admin user ID
 * @param token - FCM token
 */
export async function registerTokenWithBackend(
  adminUserId: number,
  token: string
): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(
      `${apiUrl}/notifications/admin/${adminUserId}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fcmToken: token }),
      }
    );

    if (response.ok) {
      console.log('✅ FCM token registered with backend');
      return true;
    } else {
      console.error('❌ Failed to register FCM token:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering FCM token with backend:', error);
    return false;
  }
}

/**
 * Setup foreground message listener
 * @param onNotificationReceived - Callback when notification is received
 */
export function setupMessageListener(
  onNotificationReceived?: (payload: any) => void
): void {
  if (typeof window === 'undefined') return;

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.warn('⚠️  Firebase Messaging not initialized. Cannot setup listener.');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('📱 Foreground notification received:', payload);

    const notificationTitle = payload.notification?.title || 'DTG FieldLink';
    const notificationOptions = {
      body: payload.notification?.body || 'New notification',
      icon: '/icon.png',
      badge: '/badge.png',
      tag: payload.data?.ticketId || 'notification',
      data: payload.data,
    };

    // Show browser notification
    if (notificationPermissionGranted && 'Notification' in window) {
      const notification = new Notification(notificationTitle, notificationOptions);
      
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle notification click - navigate to ticket detail
        if (payload.data?.ticketId) {
          window.location.href = `/dashboard/tickets/${payload.data.ticketId}`;
        }
        
        notification.close();
      };
    }

    // Call custom callback if provided
    if (onNotificationReceived) {
      onNotificationReceived(payload);
    }
  });

  console.log('✅ Foreground message listener setup');
}

/**
 * Unregister FCM token from backend (on logout)
 * @param adminUserId - Admin user ID
 */
export async function unregisterTokenFromBackend(
  adminUserId: number
): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(
      `${apiUrl}/notifications/admin/${adminUserId}/token`,
      {
        method: 'DELETE',
      }
    );

    if (response.ok) {
      console.log('✅ FCM token unregistered from backend');
      fcmToken = null;
      return true;
    } else {
      console.error('❌ Failed to unregister FCM token:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Error unregistering FCM token from backend:', error);
    return false;
  }
}

/**
 * Get current FCM token
 */
export function getCurrentToken(): string | null {
  return fcmToken;
}

/**
 * Check if notifications are enabled
 */
export function isNotificationEnabled(): boolean {
  return notificationPermissionGranted && fcmToken !== null;
}
