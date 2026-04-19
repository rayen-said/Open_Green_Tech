import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/notification_service.dart';
import '../../core/theme/app_theme.dart';
import '../providers/app_providers.dart';
import '../widgets/gamification_widget.dart';

/// XP hub and reminder controls (syncs with `POST /api/user/gamification`).
class GamificationScreen extends ConsumerWidget {
  const GamificationScreen({super.key});

  static const _notify = NotificationService();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Grow'),
        actions: [
          IconButton(
            tooltip: 'Sync',
            onPressed: () async {
              ref.invalidate(gamificationProvider);
              await ref.read(syncRepositoryProvider).syncNow();
            },
            icon: const Icon(Icons.sync),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const GamificationWidget(),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Smart reminders',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Schedule local notifications for watering and fertilizer checks.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 10),
                  FilledButton.tonal(
                    onPressed: () async {
                      await _notify.requestSystemPermission();
                      await _notify.scheduleCareReminders();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Reminders scheduled')),
                        );
                      }
                    },
                    child: const Text('Enable reminders'),
                  ),
                  TextButton(
                    onPressed: () async {
                      await _notify.cancelAll();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Reminders cancelled')),
                        );
                      }
                    },
                    child: const Text('Cancel all reminders'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
