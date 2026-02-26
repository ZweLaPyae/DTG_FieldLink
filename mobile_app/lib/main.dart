// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart'; // Firebase initialization
import 'config/app_theme.dart';
import 'pages/login_page.dart';
import 'pages/home.dart';
import 'config/firebase_config.dart'; // Firebase config
import 'services/notification_service.dart'; // Push notifications
import 'providers/auth_provider.dart'; // Auth provider

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  // ⚠️ TODO: Download google-services.json from Firebase Console
  // ⚠️ Place it at: android/app/google-services.json
  // ⚠️ Without this file, app will crash with: "Default FirebaseApp is not initialized"
  // Firebase must be initialized before app starts
  try {
    await Firebase.initializeApp();
    print('✅ Firebase initialized successfully');

    // Check if Firebase is properly configured
    if (!FirebaseConfig.isConfigured) {
      print('⚠️ WARNING: Firebase not configured!');
      print('⚠️ Update values in lib/config/firebase_config.dart');
      print('⚠️ Firebase configuration error - contact administrator');
    }
    
    // Initialize push notifications (FCM)
    await NotificationService.initialize();
    print('✅ Push notifications initialized');
  } catch (e) {
    print('❌ Firebase initialization failed: $e');
    print('⚠️ Make sure google-services.json is in android/app/');
    print('⚠️ Firebase setup required - contact administrator');
    // Continue running app even if Firebase fails (for testing)
  }

  runApp(const ProviderScope(child: FieldLinkApp()));
}

class FieldLinkApp extends StatelessWidget {
  const FieldLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DTG FieldLink',
      theme: AppTheme.lightTheme,
      home: const AuthWrapper(),
      debugShowCheckedModeBanner: false,
      // Define named routes
      routes: {'/login': (context) => const LoginPage()},
    );
  }
}

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    
    // Check if user is authenticated
    if (authState.isAuthenticated && authState.technician != null) {
      return const HomePage();
    } else {
      return const LoginPage();
    }
  }
}
