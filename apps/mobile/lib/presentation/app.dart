import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/app_config.dart';
import 'providers/app_providers.dart';
import 'screens/main_shell_screen.dart';

class CropAdvisorApp extends ConsumerWidget {
  const CropAdvisorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(syncBootstrapProvider);

    return MaterialApp(
      title: 'AI Crop Advisor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
      ),
      home: const MainShellScreen(),
      builder: (context, child) {
        return Banner(
          message: AppConfig.mockMode ? 'MOCK MODE' : 'LIVE MODE',
          location: BannerLocation.topEnd,
          color: AppConfig.mockMode ? Colors.orange : Colors.green,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
