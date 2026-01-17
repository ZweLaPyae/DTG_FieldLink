// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/app_theme.dart';
import 'pages/home.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(
    const ProviderScope(
      child: FieldLinkApp(),
    ),
  );
}

class FieldLinkApp extends StatelessWidget {
  const FieldLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DTG FieldLink',
      theme: AppTheme.lightTheme,
      home: const HomePage(),
      debugShowCheckedModeBanner: false,
    );
  }
}
