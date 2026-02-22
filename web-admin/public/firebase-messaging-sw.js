// web-admin/public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker for background notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDVz6MPkTPwZXVke4Btb2DKsTo4lUWJe78",
  authDomain: "dtg-fieldlink-71872.firebaseapp.com",
  projectId: "dtg-fieldlink-71872",
  storageBucket: "dtg-fieldlink-71872.firebasestorage.app",
  messagingSenderId: "107877922405361975376",
  appId: "1:24358994999:web:5fe0cdba3a3aaa4a73ebb2"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Background notification received:', payload);

  const notificationTitle = payload.notification?.title || 'DTG FieldLink';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: payload.data?.ticketId || 'notification',
    data: payload.data,
    requireInteraction: true, // Keep notification visible until clicked
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.notification.data);

  event.notification.close();

  // Navigate to ticket detail page if ticketId is provided
  const ticketId = event.notification.data?.ticketId;
  if (ticketId) {
    event.waitUntil(
      clients.openWindow(`/dashboard/tickets/${ticketId}`)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});
