import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/notifications/local_notifications.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/gamification_state.dart';
import '../providers/app_providers.dart';

/// Mobile-only XP, levels, and daily tasks (syncs with `POST /api/user/gamification`).
class GamificationScreen extends ConsumerWidget {
  const GamificationScreen({super.key});

  static String _levelLabel(String code) {
    switch (code) {
      case 'EXPERT':
        return 'Expert Farmer';
      case 'INTERMEDIATE':
        return 'Intermediate Farmer';
      default:
        return 'Beginner Farmer';
    }
  }

  static double _progressToNextLevel(int xp) {
    if (xp >= 300) {
      return 1;
    }
    if (xp >= 100) {
      return (xp - 100) / 200;
    }
    return xp / 100;
  }

  static int _nextThreshold(int xp) {
    if (xp < 100) {
      return 100;
    }
    if (xp < 300) {
      return 300;
    }
    return xp;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(gamificationProvider);

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
      body: async.when(
        data: (state) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.eco, color: AppColors.green500),
                          const SizedBox(width: 8),
                          Text(
                            _levelLabel(state.level),
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${state.xp} XP · next milestone at ${_nextThreshold(state.xp)} XP',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          minHeight: 12,
                          value: _progressToNextLevel(state.xp).clamp(0.0, 1.0),
                          color: AppColors.green500,
                          backgroundColor: AppColors.bgSoft,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Daily tasks',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 8),
                      ..._taskTiles(context, ref, state),
                    ],
                  ),
                ),
              ),
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
                          await LocalNotifications.requestPermission();
                          await LocalNotifications.scheduleCropReminders();
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
                          await LocalNotifications.cancelAll();
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
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
      ),
    );
  }

  List<Widget> _taskTiles(
    BuildContext context,
    WidgetRef ref,
    GamificationState state,
  ) {
    final raw = state.tasksState['tasks'];
    if (raw is! List || raw.isEmpty) {
      return [
        Text(
          'Complete a system check or follow a recommendation to earn XP.',
          style: TextStyle(color: AppColors.textMuted),
        ),
      ];
    }
    return raw.map<Widget>((item) {
      if (item is! Map) {
        return const SizedBox.shrink();
      }
      final m = Map<String, dynamic>.from(item);
      final id = m['id']?.toString() ?? '';
      final title = m['title']?.toString() ?? 'Task';
      final xpReward = (m['xpReward'] as num?)?.round() ?? 10;
      final done = m['completed'] == true;
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          tileColor: AppColors.surfaceMuted,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          leading: Icon(
            done ? Icons.check_circle : Icons.radio_button_unchecked,
            color: done ? AppColors.green500 : AppColors.textMuted,
          ),
          title: Text(title),
          subtitle: Text('+$xpReward XP'),
          trailing: done
              ? null
              : TextButton(
                  onPressed: () async {
                    String event = 'check_system_health';
                    if (id == 'water_today') {
                      event = 'water_on_time';
                    }
                    await ref.read(cropRepositoryProvider).syncGamification(
                          event: event,
                        );
                    ref.invalidate(gamificationProvider);
                  },
                  child: const Text('Done'),
                ),
        ),
      );
    }).toList();
  }
}
