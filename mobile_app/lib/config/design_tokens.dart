// lib/config/design_tokens.dart
import 'package:flutter/material.dart';

/// Centralized design tokens for consistent theming
class DesignTokens {
  // Private constructor
  DesignTokens._();

  // Brand Colors
  static const Color primaryBlue = Color(0xFF1E40AF);
  static const Color secondaryBlue = Color(0xFF3B82F6);
  static const Color accentBlue = Color(0xFF2563EB);
  
  // Status Colors
  static const Color successGreen = Color(0xFF10B981);
  static const Color successGreenDark = Color(0xFF059669);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color errorRed = Color(0xFFDC2626);
  static const Color infoBlue = Color(0xFF3B82F6);
  
  // Priority Colors
  static const Color priorityLow = Color(0xFF6B7280);
  static const Color priorityMedium = Color(0xFF3B82F6);
  static const Color priorityHigh = Color(0xFFF59E0B);
  static const Color priorityCritical = Color(0xFFDC2626);
  
  // Neutral Colors
  static const Color backgroundColor = Color(0xFFF8F9FC);
  static const Color surfaceWhite = Colors.white;
  static const Color textDark = Color(0xFF1E293B);
  static const Color textMedium = Color(0xFF475569);
  static const Color textLight = Color(0xFF94A3B8);
  static const Color borderLight = Color(0xFFE2E8F0);
  
  // Spacing Scale
  static const double space4 = 4.0;
  static const double space6 = 6.0;
  static const double space8 = 8.0;
  static const double space10 = 10.0;
  static const double space12 = 12.0;
  static const double space14 = 14.0;
  static const double space16 = 16.0;
  static const double space18 = 18.0;
  static const double space20 = 20.0;
  static const double space24 = 24.0;
  static const double space30 = 30.0;
  static const double space56 = 56.0;
  
  // Border Radius
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  static const double radiusXLarge = 20.0;
  static const double radiusRound = 24.0;
  
  // Elevation/Shadow
  static BoxShadow shadowSmall({Color? color}) => BoxShadow(
    color: (color ?? Colors.black).withOpacity(0.04),
    blurRadius: 6,
    offset: const Offset(0, 2),
  );
  
  static BoxShadow shadowMedium({Color? color}) => BoxShadow(
    color: (color ?? Colors.black).withOpacity(0.08),
    blurRadius: 12,
    offset: const Offset(0, 4),
  );
  
  static BoxShadow shadowLarge({Color? color}) => BoxShadow(
    color: (color ?? Colors.black).withOpacity(0.15),
    blurRadius: 20,
    offset: const Offset(0, 8),
  );
  
  // Typography
  static const TextStyle headingLarge = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: textDark,
  );
  
  static const TextStyle headingMedium = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: textDark,
  );
  
  static const TextStyle headingSmall = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: textDark,
  );
  
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textDark,
  );
  
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: textDark,
  );
  
  static const TextStyle bodySmall = TextStyle(
    fontSize: 13,
    color: textMedium,
  );
  
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: textLight,
  );
  
  static const TextStyle label = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
  );
  
  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryBlue, secondaryBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient successGradient = LinearGradient(
    colors: [successGreen, successGreenDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static LinearGradient priorityGradient(Color color) => LinearGradient(
    colors: [color, color.withOpacity(0.8)],
  );
  
  // Icon Sizes
  static const double iconSmall = 16.0;
  static const double iconMedium = 20.0;
  static const double iconLarge = 24.0;
  static const double iconXLarge = 28.0;
  
  // Animation Durations
  static const Duration animationFast = Duration(milliseconds: 150);
  static const Duration animationMedium = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);
}
