// backend/src/lib/notificationService.js
// Firebase Cloud Messaging service for push notifications

import { getFirebaseAdmin } from './firebase-admin.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Send notification to a single device
 * @param {string} fcmToken - Device FCM token
 * @param {object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Additional data payload
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendNotification(fcmToken, notification) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Cannot send notification.');
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  if (!fcmToken) {
    console.warn('⚠️  No FCM token provided');
    return { success: false, error: 'No FCM token provided' };
  }

  const message = {
    token: fcmToken,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
        priority: 'high',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Successfully sent notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('⚠️  Invalid or unregistered FCM token:', fcmToken);
      return { success: false, error: 'Invalid FCM token', invalidToken: true };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple devices
 * @param {string[]} fcmTokens - Array of device FCM tokens
 * @param {object} notification - Notification data
 * @returns {Promise<{successCount: number, failureCount: number, responses: Array}>}
 */
export async function sendMulticastNotification(fcmTokens, notification) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Cannot send notifications.');
    return { successCount: 0, failureCount: fcmTokens.length, responses: [] };
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    console.warn('⚠️  No FCM tokens provided');
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  // Filter out null/undefined tokens
  const validTokens = fcmTokens.filter(token => token);
  
  if (validTokens.length === 0) {
    console.warn('⚠️  No valid FCM tokens provided');
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const message = {
    tokens: validTokens,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Successfully sent ${response.successCount} notifications`);
    console.log(`❌ Failed to send ${response.failureCount} notifications`);
    
    // Log invalid tokens
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        if (resp.error.code === 'messaging/invalid-registration-token' ||
            resp.error.code === 'messaging/registration-token-not-registered') {
          console.warn(`⚠️  Invalid token: ${validTokens[idx]}`);
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('❌ Error sending multicast notification:', error.message);
    throw error;
  }
}

/**
 * Send notification to a topic
 * @param {string} topic - Topic name (e.g., 'all-technicians', 'all-admins')
 * @param {object} notification - Notification data
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendTopicNotification(topic, notification) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Cannot send notification.');
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  const message = {
    topic: topic,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    android: {
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Successfully sent topic notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending topic notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe device(s) to a topic
 * @param {string|string[]} fcmTokens - Single token or array of device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<{successCount: number, failureCount: number}>}
 */
export async function subscribeToTopic(fcmTokens, topic) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Cannot subscribe to topic.');
    return { successCount: 0, failureCount: 1 };
  }

  const tokens = Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens];
  const validTokens = tokens.filter(token => token);

  try {
    const response = await admin.messaging().subscribeToTopic(validTokens, topic);
    console.log(`✅ Successfully subscribed ${response.successCount} devices to ${topic}`);
    return response;
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error.message);
    throw error;
  }
}

/**
 * Unsubscribe device(s) from a topic
 * @param {string|string[]} fcmTokens - Single token or array of device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<{successCount: number, failureCount: number}>}
 */
export async function unsubscribeFromTopic(fcmTokens, topic) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    console.warn('⚠️  Firebase Admin not initialized. Cannot unsubscribe from topic.');
    return { successCount: 0, failureCount: 1 };
  }

  const tokens = Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens];
  const validTokens = tokens.filter(token => token);

  try {
    const response = await admin.messaging().unsubscribeFromTopic(validTokens, topic);
    console.log(`✅ Successfully unsubscribed ${response.successCount} devices from ${topic}`);
    return response;
  } catch (error) {
    console.error('❌ Error unsubscribing from topic:', error.message);
    throw error;
  }
}

/**
 * Store notification in database and send to user
 * @param {number} userId - User ID (admin or technician)
 * @param {string} userType - 'admin' or 'technician'
 * @param {string} fcmToken - User's FCM token (optional - if null, only stores in DB)
 * @param {object} notification - Notification data
 * @returns {Promise<{success: boolean, notificationId?: number, error?: string}>}
 */
export async function sendAndStoreNotification(userId, userType, fcmToken, notification) {
  try {
    // Store notification in database first
    const dbNotification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        userType: userType,
        title: notification.title,
        body: notification.body,
        type: notification.data?.type || 'general',
        ticketId: notification.data?.ticketId || null,
        data: notification.data || {},
        read: false,
      },
    });

    console.log(`💾 Stored notification in database: ID ${dbNotification.id}`);

    // Send via FCM if token is available
    if (fcmToken) {
      const fcmResult = await sendNotification(fcmToken, notification);
      return { 
        success: true, 
        notificationId: dbNotification.id, 
        fcmSent: fcmResult.success 
      };
    }

    // If no FCM token, still return success (notification stored in DB)
    return { 
      success: true, 
      notificationId: dbNotification.id, 
      fcmSent: false 
    };
  } catch (error) {
    console.error('❌ Error storing and sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Store notifications for multiple users and send via FCM
 * @param {Array<{userId: number, userType: string, fcmToken: string}>} recipients
 * @param {object} notification - Notification data
 * @returns {Promise<{successCount: number, failureCount: number}>}
 */
export async function sendAndStoreMultipleNotifications(recipients, notification) {
  let successCount = 0;
  let failureCount = 0;

  for (const recipient of recipients) {
    const result = await sendAndStoreNotification(
      recipient.userId,
      recipient.userType,
      recipient.fcmToken,
      notification
    );
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(`✅ Stored and sent ${successCount} notifications, ${failureCount} failed`);
  return { successCount, failureCount };
}

export default {
  sendNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendAndStoreNotification,
  sendAndStoreMultipleNotifications,
};
