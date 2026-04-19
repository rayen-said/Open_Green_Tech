import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/device.dart';
import '../providers/app_providers.dart';
import 'gamification_screen.dart';
import 'home_screen.dart';
import 'insights_screen.dart';
import 'settings_screen.dart';
import 'system_screen.dart';

class MainShellScreen extends ConsumerStatefulWidget {
  const MainShellScreen({super.key});

  @override
  ConsumerState<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends ConsumerState<MainShellScreen> {
  int _index = 0;

  static const List<Widget> _pages = [
    HomeScreen(),
    InsightsScreen(),
    GamificationScreen(),
    SystemScreen(),
    SettingsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cropRepositoryProvider).tryDailyLoginXp();
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<List<Device>>>(devicesProvider, (prev, next) {
      next.whenData((devices) {
        if (devices.isEmpty) {
          return;
        }
        final cur = ref.read(selectedDeviceIdProvider);
        final exists =
            cur != null && devices.any((element) => element.id == cur);
        if (cur == null || cur.isEmpty || !exists) {
          ref.read(selectedDeviceIdProvider.notifier).set(devices.first.id);
        }
      });
    });

    return Scaffold(
      body: SafeArea(child: _pages[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) {
          setState(() {
            _index = value;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            label: 'Insights',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            label: 'Grow',
          ),
          NavigationDestination(
            icon: Icon(Icons.monitor_heart_outlined),
            label: 'System',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
