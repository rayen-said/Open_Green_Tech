import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/env_config.dart';
import '../core/navigation/app_router.dart';
import '../core/theme/app_theme.dart';
import 'providers/app_providers.dart';

class CropAdvisorApp extends ConsumerWidget {
  const CropAdvisorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(syncBootstrapProvider);

    return MaterialApp(
      title: 'Open Green — Farming Buddy',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AppRouter(),
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
