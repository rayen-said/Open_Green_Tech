import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens aligned with `apps/web/src/app/globals.css`.
abstract final class AppColors {
  static const Color bg = Color(0xFFF7F8F3);
  static const Color bgSoft = Color(0xFFEEF2EA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF4F6F0);
  static const Color text = Color(0xFF1E2A1F);
  static const Color textMuted = Color(0xFF5F6B5F);
  static const Color green500 = Color(0xFF2F7F4D);
  static const Color green600 = Color(0xFF276A40);
  static const Color earth500 = Color(0xFF8C6846);
  static const Color border = Color(0xFFDDE6D8);
  static const Color danger = Color(0xFFC84B4B);
  static const Color chartTemp = Color(0xFF2C8F58);
  static const Color chartHumidity = Color(0xFF4F46E5);
  static const Color chartLight = Color(0xFFA16207);
}

ThemeData buildAppTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.green500,
    brightness: Brightness.light,
    primary: AppColors.green500,
    onPrimary: Colors.white,
    surface: AppColors.surface,
    onSurface: AppColors.text,
    outline: AppColors.border,
    error: AppColors.danger,
  );

  final textTheme = GoogleFonts.manropeTextTheme().apply(
    bodyColor: AppColors.text,
    displayColor: AppColors.text,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.bg,
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surface.withValues(alpha: 0.92),
      foregroundColor: AppColors.text,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        color: AppColors.text,
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppColors.border),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.green500, width: 1.4),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.green500,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.surface.withValues(alpha: 0.95),
      indicatorColor: AppColors.surfaceMuted,
      labelTextStyle: WidgetStatePropertyAll(
        textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
      ),
    ),
  );
}
