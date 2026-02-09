// lib/widgets/primary_button.dart
import 'package:flutter/material.dart';

enum ButtonVariant {
  primary,   // Green (like Accept button)
  secondary, // Blue
  danger,    // Red
  success,   // Green alternative
  outline,   // Outlined
}

class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final double? width;
  final EdgeInsetsGeometry? padding;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.width,
    this.padding,
  });

  Color _getBackgroundColor() {
    switch (variant) {
      case ButtonVariant.primary:
      case ButtonVariant.success:
        return const Color(0xFF10B981); // Green
      case ButtonVariant.secondary:
        return const Color(0xFF3B82F6); // Blue
      case ButtonVariant.danger:
        return const Color(0xFFEF4444); // Red
      case ButtonVariant.outline:
        return Colors.transparent;
    }
  }

  Color _getForegroundColor() {
    if (variant == ButtonVariant.outline) {
      return const Color(0xFF3B82F6); // Blue text for outline
    }
    return Colors.white;
  }

  Border? _getBorder() {
    if (variant == ButtonVariant.outline) {
      return Border.all(color: const Color(0xFF3B82F6), width: 1.5);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: _getBackgroundColor(),
      foregroundColor: _getForegroundColor(),
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: _getBorder() != null 
            ? BorderSide(color: _getBorder()!.top.color, width: 1.5)
            : BorderSide.none,
      ),
      elevation: variant == ButtonVariant.outline ? 0 : 2,
      shadowColor: Colors.black26,
    );

    final child = isLoading
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          )
        : (icon != null
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    text,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ));

    return SizedBox(
      width: width,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: buttonStyle,
        child: child,
      ),
    );
  }
}
