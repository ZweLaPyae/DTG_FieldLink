// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart'; // Firebase initialization
import 'config/app_theme.dart';
import 'pages/login_page.dart';
import 'config/firebase_config.dart'; // Firebase config

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
      home: const LoginPage(),
      debugShowCheckedModeBanner: false,
      // Define named routes
      routes: {'/login': (context) => const LoginPage()},
    );
  }
}
