// lib/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📱 Background notification received: ${message.messageId}');
  print('   Title: ${message.notification?.title}');
  print('   Body: ${message.notification?.body}');
  print('   Data: ${message.data}');
}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  
  static bool _initialized = false;
  // Support multiple listeners (broadcast pattern)
  static final List<Function()> _notificationListeners = [];
  
  // Add listener
  static void addListener(Function() callback) {
    if (!_notificationListeners.contains(callback)) {
      _notificationListeners.add(callback);
      print('✅ Notification listener added (total: ${_notificationListeners.length})');
    }
  }
  
  // Remove listener
  static void removeListener(Function() callback) {
    _notificationListeners.remove(callback);
    print('🔕 Notification listener removed (remaining: ${_notificationListeners.length})');
  }
  
  // Notify all listeners
  static void _notifyListeners() {
    print('📢 Notifying ${_notificationListeners.length} listeners...');
    // Create a copy to avoid concurrent modification
    final listeners = List<Function()>.from(_notificationListeners);
    for (var listener in listeners) {
      try {
        listener();
      } catch (e) {
        print('❌ Error calling notification listener: $e');
      }
    }
  }
  
  // Initialize notifications
  static Future<void> initialize() async {
    if (_initialized) {
      print('⚠️  Notification service already initialized');
      return;
    }
    
    print('🔔 Initializing notification service...');
    
    try {
      // Request permissions (iOS requires this, Android auto-grants)
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      
      print('📋 Notification permission: ${settings.authorizationStatus}');
      
      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        print('❌ Notification permissions denied by user');
        return;
      }
      
      // Initialize local notifications
      const AndroidInitializationSettings androidSettings = 
          AndroidInitializationSettings('@mipmap/ic_launcher');
      
      const DarwinInitializationSettings iosSettings = 
          DarwinInitializationSettings(
            requestAlertPermission: true,
            requestBadgePermission: true,
            requestSoundPermission: true,
          );
      
      const InitializationSettings initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );
      
      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _handleNotificationTap,
      );
      
      // Create notification channel (Android)
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'default',
        'DTG FieldLink Notifications',
        description: 'Important notifications about tickets and tasks',
        importance: Importance.high,
        playSound: true,
        enableVibration: true,
      );
      
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
      
      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('📱 Foreground notification received');
        print('   Title: ${message.notification?.title}');
        print('   Body: ${message.notification?.body}');
        print('   Data: ${message.data}');
        
        _showLocalNotification(message);
        
        // Notify all registered listeners
        _notifyListeners();
      });
      
      // Handle notification taps (when app is in background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('👆 Notification tapped (app in background)');
        print('   Data: ${message.data}');
        _handleNotificationData(message.data);
      });
      
      // Check if app was opened from a terminated state via notification
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        print('👆 App opened from notification (terminated state)');
        print('   Data: ${initialMessage.data}');
        _handleNotificationData(initialMessage.data);
      }
      
      _initialized = true;
      print('✅ Notification service initialized successfully');
    } catch (e) {
      print('❌ Error initializing notifications: $e');
    }
  }
  
  // Get FCM token and register with backend
  static Future<String?> registerToken(String userId, {bool isAdmin = false}) async {
    try {
      String? token = await _messaging.getToken();
      
      if (token != null) {
        print('🔑 FCM Token obtained: ${token.substring(0, 20)}...');
        await _sendTokenToBackend(userId, token, isAdmin);
        
        // Listen for token refresh
        _messaging.onTokenRefresh.listen((newToken) {
          print('🔄 FCM Token refreshed');
          _sendTokenToBackend(userId, newToken, isAdmin);
        });
        
        return token;
      } else {
        print('❌ Failed to get FCM token');
        return null;
      }
    } catch (e) {
      print('❌ Error registering FCM token: $e');
      return null;
    }
  }
  
  // Remove token from backend (logout)
  static Future<void> unregisterToken(String userId, {bool isAdmin = false}) async {
    try {
      final userType = isAdmin ? 'admin' : 'technician';
      final url = '${ApiConfig.baseUrl}/notifications/$userType/$userId/token';
      
      final response = await http.delete(Uri.parse(url));
      
      if (response.statusCode == 200) {
        print('✅ FCM token removed from backend');
      } else {
        print('⚠️  Failed to remove FCM token: ${response.body}');
      }
    } catch (e) {
      print('❌ Error removing FCM token: $e');
    }
  }
  
  // Send token to backend
  static Future<void> _sendTokenToBackend(String userId, String token, bool isAdmin) async {
    try {
      final userType = isAdmin ? 'admin' : 'technician';
      final url = '${ApiConfig.baseUrl}/notifications/$userType/$userId/token';
      
      print('📤 Sending FCM token to: $url');
      
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'fcmToken': token}),
      );
      
      if (response.statusCode == 200) {
        print('✅ FCM token registered with backend successfully');
      } else {
        print('❌ Failed to register FCM token: ${response.statusCode}');
        print('   Response: ${response.body}');
      }
    } catch (e) {
      print('❌ Error sending FCM token to backend: $e');
    }
  }
  
  // Show local notification (for foreground messages)
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'default',
      'DTG FieldLink Notifications',
      channelDescription: 'Important notifications about tickets and tasks',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );
    
    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'DTG FieldLink',
      message.notification?.body ?? 'New notification',
      details,
      payload: json.encode(message.data),
    );
  }
  
  // Handle notification tap
  static void _handleNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      try {
        final data = json.decode(response.payload!);
        _handleNotificationData(data);
      } catch (e) {
        print('❌ Error parsing notification payload: $e');
      }
    }
  }
  
  // Handle notification data (navigate to appropriate screen)
  static void _handleNotificationData(Map<String, dynamic> data) {
    print('🔍 Handling notification data: $data');
    
    final type = data['type'];
    final ticketId = data['ticketId'];
    
    switch (type) {
      case 'ticket_assigned':
        print('📌 Navigate to ticket: $ticketId (newly assigned)');
        // TODO: Navigate to ticket detail page
        // You can use go_router or your navigation method here
        break;
        
      case 'ticket_review_requested':
        print('📌 Navigate to ticket: $ticketId (needs review)');
        // TODO: Navigate to ticket detail page for review
        break;
        
      case 'ticket_completed':
        print('📌 Navigate to ticket: $ticketId (completed)');
        // TODO: Navigate to ticket detail page
        break;
        
      case 'test':
        print('📌 Test notification received');
        break;
        
      default:
        print('⚠️  Unknown notification type: $type');
    }
  }
  
  // Get current FCM token (useful for debugging)
  static Future<String?> getCurrentToken() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        print('📋 Current FCM Token: $token');
      }
      return token;
    } catch (e) {
      print('❌ Error getting current token: $e');
      return null;
    }
  }
}

// Global functions for notification callbacks (outside of class)
void addNotificationListener(Function() callback) {
  NotificationService.addListener(callback);
}

void removeNotificationListener(Function() callback) {
  NotificationService.removeListener(callback);
}

// Backwards compatibility - keep old function names
void setNotificationReceivedCallback(Function() callback) {
  NotificationService.addListener(callback);
}

void clearNotificationReceivedCallback() {
  // Deprecated - use removeNotificationListener instead
  print('⚠️  clearNotificationReceivedCallback() is deprecated');
}
