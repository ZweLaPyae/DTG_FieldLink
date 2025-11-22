// lib/main.dart
import 'package:flutter/material.dart';
import 'pages/home.dart';

void main() {
  runApp(const FieldLinkApp());
}

class FieldLinkApp extends StatelessWidget {
  const FieldLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DTG FieldLink',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: const Color(0xFFF5F6FA),
      ),
      home: HomePage(),
      debugShowCheckedModeBanner: false,
    );
  }
}
