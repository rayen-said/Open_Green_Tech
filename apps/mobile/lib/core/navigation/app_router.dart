import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/offline/offline_store.dart';
import '../../presentation/providers/app_providers.dart';
import '../../presentation/screens/auth_screen.dart';
import '../../presentation/screens/landing_screen.dart';
import '../../presentation/screens/main_shell_screen.dart';
import '../../presentation/screens/onboarding_screen.dart';
import '../../presentation/screens/permissions_screen.dart';
import '../config/env_config.dart';

/// Root navigation: landing → auth → permissions → onboarding → main shell.
class AppRouter extends ConsumerStatefulWidget {
  const AppRouter({super.key});

  @override
  ConsumerState<AppRouter> createState() => _AppRouterState();
}

class _AppRouterState extends ConsumerState<AppRouter> {
  bool _landingComplete = false;

  void _finishLanding() {
    setState(() => _landingComplete = true);
  }

  @override
  Widget build(BuildContext context) {
    final mock = EnvConfig.instance.mockMode;
    final auth = ref.watch(authNotifierProvider);

    if (mock) {
      if (!_landingComplete) {
        return LandingScreen(onFinished: _finishLanding);
      }
      return const MainShellScreen();
    }

    return auth.when(
      data: (session) {
        if (session == null) {
          if (!_landingComplete) {
            return LandingScreen(onFinished: _finishLanding);
          }
          return const AuthScreen();
        }
        final userId = session.user.id;
        final permDone = OfflineStore.instance.readPermissionsDoneForUser(userId);
        if (!permDone) {
          return PermissionsScreen(
            userId: userId,
            onFinished: () => setState(() {}),
          );
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
