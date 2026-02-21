// web-admin/src/hooks/useNotifications.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  requestNotificationPermission,
  registerTokenWithBackend,
  setupMessageListener,
  unregisterTokenFromBackend,
  isNotificationEnabled,
} from '@/lib/notification-service';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    ticketId?: string;
    type?: string;
  };
}

export function useNotifications(adminUserId?: number) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [latestNotification, setLatestNotification] = useState<NotificationPayload | null>(null);
  const initStartedRef = useRef(false);

  const initializeNotifications = useCallback(async () => {
    if (!adminUserId || isInitializing || initStartedRef.current) {
      console.log('⏭️  Skipping initialization:', { 
        hasAdminId: !!adminUserId, 
        isInitializing, 
        alreadyStarted: initStartedRef.current 
      });
      return;
    }

    initStartedRef.current = true;
    setIsInitializing(true);
    console.log('🔔 Initializing notifications for admin:', adminUserId);

    try {
      // Request permission and get token
      const token = await requestNotificationPermission();

      if (token) {
        // Register token with backend
        const registered = await registerTokenWithBackend(adminUserId, token);

        if (registered) {
          // Setup message listener
          setupMessageListener((payload: NotificationPayload) => {
            console.log('📬 New notification received:', payload);
            setLatestNotification(payload);
          });

          setNotificationsEnabled(true);
          console.log('✅ Notifications fully initialized');
        } else {
          console.warn('⚠️  Failed to register token with backend');
        }
      } else {
        console.warn('⚠️  Failed to obtain FCM token');
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [adminUserId, isInitializing]);

  const disableNotifications = useCallback(async () => {
    if (adminUserId) {
      await unregisterTokenFromBackend(adminUserId);
      setNotificationsEnabled(false);
      console.log('🔕 Notifications disabled');
    }
  }, [adminUserId]);

  useEffect(() => {
    // Check if already enabled
    if (isNotificationEnabled()) {
      setNotificationsEnabled(true);
    }
  }, []);

  return {
    notificationsEnabled,
    isInitializing,
    latestNotification,
    initializeNotifications,
    disableNotifications,
    clearLatestNotification: () => setLatestNotification(null),
  };
}
