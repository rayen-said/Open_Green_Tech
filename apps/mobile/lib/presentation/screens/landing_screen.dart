import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme/app_theme.dart';

/// Branded intro before auth. Auto-advances after ~2.5s or on tap.
class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key, required this.onFinished});

  final VoidCallback onFinished;

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(milliseconds: 2500), _go);
  }

  void _go() {
    if (!mounted) {
      return;
    }
    widget.onFinished();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          _timer?.cancel();
          _go();
        },
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF0F1A12),
                Color(0xFF152018),
                Color(0xFF1A2E1F),
              ],
            ),
          ),
          child: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 108,
                      height: 108,
                      decoration: BoxDecoration(
                        color: AppColors.green500.withValues(alpha: 0.18),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.green500.withValues(alpha: 0.45),
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        Icons.eco_rounded,
                        size: 56,
                        color: AppColors.green500,
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 600.ms, curve: Curves.easeOut)
                        .scale(
                          begin: const Offset(0.85, 0.85),
                          end: const Offset(1, 1),
                          duration: 700.ms,
                          curve: Curves.easeOutCubic,
                        ),
                    const SizedBox(height: 28),
                    Text(
                      'Open Green',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ).animate().fadeIn(delay: 120.ms, duration: 500.ms),
                    const SizedBox(height: 8),
                    Text(
                      'Your AI Farming Companion',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: AppColors.green500.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w600,
                      ),
                    ).animate().fadeIn(delay: 220.ms, duration: 500.ms),
                    const SizedBox(height: 16),
                    Text(
                      'Daily guidance, smart reminders, and crop health insights — without the dashboard noise.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.72),
                        height: 1.45,
                      ),
                    ).animate().fadeIn(delay: 320.ms, duration: 550.ms),
                    const SizedBox(height: 40),
                    Text(
                      'Tap anywhere to continue',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                    ).animate().fadeIn(delay: 900.ms, duration: 400.ms),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
