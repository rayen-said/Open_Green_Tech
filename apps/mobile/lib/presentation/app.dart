import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/env_config.dart';
import '../core/theme/app_theme.dart';
import 'providers/app_providers.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell_screen.dart';
import 'screens/onboarding_screen.dart';

class CropAdvisorApp extends ConsumerWidget {
  const CropAdvisorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(syncBootstrapProvider);
    ref.watch(realtimeBootstrapProvider);

    final auth = ref.watch(authNotifierProvider);

    return MaterialApp(
      title: 'Open Green — Crop Advisor',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: auth.when(
        data: (session) {
          final mock = EnvConfig.instance.mockMode;
          if (!mock && session == null) {
            return const LoginScreen();
          }
          if (mock) {
            return const MainShellScreen();
          }
          final farmer = ref.watch(farmerProfileProvider);
          return farmer.when(
            data: (profile) {
              if (!profile.completedOnboarding) {
                return const OnboardingScreen();
              }
              return const MainShellScreen();
            },
            loading: () => const _Splash(),
            error: (e, _) => _ErrorScreen(message: e.toString()),
          );
        },
        loading: () => const _Splash(),
        error: (e, _) => _ErrorScreen(message: e.toString()),
      ),
      builder: (context, child) {
        return Banner(
          message: EnvConfig.instance.mockMode ? 'MOCK' : 'LIVE',
          location: BannerLocation.topEnd,
          color: EnvConfig.instance.mockMode ? Colors.orange : Colors.green,
          textStyle: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

class _ErrorScreen extends StatelessWidget {
  const _ErrorScreen({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(message, textAlign: TextAlign.center),
        ),
      ),
    );
  }
}
