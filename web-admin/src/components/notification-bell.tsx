// web-admin/src/components/notification-bell.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationBellProps {
  adminUserId?: number;
}

export function NotificationBell({ adminUserId }: NotificationBellProps) {
  const {
    notificationsEnabled,
    isInitializing,
    latestNotification,
    initializeNotifications,
    clearLatestNotification,
  } = useNotifications(adminUserId);

  const { toast } = useToast();
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const autoInitAttempted = useRef(false);

  // Auto-initialize notifications on mount (only once)
  useEffect(() => {
    if (adminUserId && !notificationsEnabled && !isInitializing && !autoInitAttempted.current) {
      autoInitAttempted.current = true;
      console.log('🔔 Auto-initializing notifications for admin:', adminUserId);
      initializeNotifications();
    }
  }, [adminUserId, notificationsEnabled, isInitializing, initializeNotifications]);

  useEffect(() => {
    if (latestNotification) {
      // Show toast notification
      toast({
        title: latestNotification.notification?.title || 'New Notification',
        description: latestNotification.notification?.body || '',
        duration: 5000,
      });

      // Animate bell icon
      setHasNewNotification(true);
      setTimeout(() => {
        setHasNewNotification(false);
        clearLatestNotification();
      }, 3000);
    }
  }, [latestNotification, toast, clearLatestNotification]);

  const handleClick = async () => {
    if (!notificationsEnabled && adminUserId) {
      await initializeNotifications();
    }
  };

  if (!adminUserId) return null;

  return (
    <Button
      variant={notificationsEnabled ? 'ghost' : 'outline'}
      size="icon"
      className="relative"
      onClick={handleClick}
      disabled={isInitializing}
      title={
        notificationsEnabled
          ? 'Notifications enabled'
          : 'Click to enable notifications'
      }
    >
      {hasNewNotification ? (
        <BellRing className="h-5 w-5 text-blue-600 animate-pulse" />
      ) : (
        <Bell
          className={`h-5 w-5 ${
            notificationsEnabled ? 'text-blue-600' : 'text-gray-600'
          }`}
        />
      )}
      {notificationsEnabled && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full" />
      )}
    </Button>
  );
}
