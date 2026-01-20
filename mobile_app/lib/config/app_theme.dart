// lib/config/app_theme.dart
import 'package:flutter/material.dart';
import 'design_tokens.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: DesignTokens.primaryBlue,
        primary: DesignTokens.primaryBlue,
        secondary: DesignTokens.secondaryBlue,
        surface: DesignTokens.surfaceWhite,
        background: DesignTokens.backgroundColor,
      ),
      
      // AppBar Theme
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: DesignTokens.surfaceWhite,
        selectedItemColor: DesignTokens.primaryBlue,
        unselectedItemColor: Colors.grey[400],
        selectedLabelStyle: DesignTokens.caption,
        unselectedLabelStyle: DesignTokens.label,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(DesignTokens.radiusXLarge),
        ),
        color: DesignTokens.surfaceWhite,
      ),
      
      // Text Theme
      textTheme: const TextTheme(
        headlineLarge: DesignTokens.headingLarge,
        headlineMedium: DesignTokens.headingMedium,
        headlineSmall: DesignTokens.headingSmall,
        bodyLarge: DesignTokens.bodyLarge,
        bodyMedium: DesignTokens.bodyMedium,
        bodySmall: DesignTokens.bodySmall,
        labelSmall: DesignTokens.caption,
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: DesignTokens.surfaceWhite,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignTokens.radiusMedium),
          borderSide: const BorderSide(color: DesignTokens.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignTokens.radiusMedium),
          borderSide: const BorderSide(color: DesignTokens.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignTokens.radiusMedium),
          borderSide: const BorderSide(color: DesignTokens.primaryBlue, width: 2),
        ),
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: DesignTokens.primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: DesignTokens.space20,
            vertical: DesignTokens.space14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusLarge),
          ),
          textStyle: DesignTokens.bodyMedium.copyWith(color: Colors.white),
        ),
      ),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: DesignTokens.borderLight,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
