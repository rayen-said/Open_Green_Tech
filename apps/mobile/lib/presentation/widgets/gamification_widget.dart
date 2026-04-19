import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/gamification_state.dart';
import '../providers/app_providers.dart';

/// XP bar, level badge, and daily tasks — used on the assistant screen and Grow tab.
class GamificationWidget extends ConsumerWidget {
  const GamificationWidget({super.key, this.embedded = false});

  final bool embedded;

  static String levelLabel(String code) {
    switch (code) {
      case 'EXPERT':
        return 'Expert';
      case 'INTERMEDIATE':
        return 'Intermediate';
      default:
        return 'Beginner';
    }
  }

  static double progressToNextLevel(int xp) {
    if (xp >= 300) {
      return 1;
    }
    if (xp >= 100) {
      return (xp - 100) / 200;
    }
    return xp / 100;
  }

  static int nextThreshold(int xp) {
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

    return async.when(
      data: (state) => _Card(context, ref, state),
      loading: () => const LinearProgressIndicator(minHeight: 2),
      error: (e, _) => Text('XP: $e', style: const TextStyle(fontSize: 12)),
    );
  }

  Widget _Card(BuildContext context, WidgetRef ref, GamificationState state) {
    final pad = embedded ? 12.0 : 16.0;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: EdgeInsets.all(pad),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.green500.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Lv · ${levelLabel(state.level)}',
                    style: TextStyle(
                      color: AppColors.green500,
                      fontWeight: FontWeight.w800,
                      fontSize: embedded ? 12 : 13,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '${state.xp} XP',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppColors.textMuted,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Next milestone at ${nextThreshold(state.xp)} XP',
              style: TextStyle(color: AppColors.textMuted, fontSize: embedded ? 11 : 13),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                minHeight: embedded ? 8 : 12,
                value: progressToNextLevel(state.xp).clamp(0.0, 1.0),
                color: AppColors.green500,
                backgroundColor: AppColors.bgSoft,
              ),
            ),
            if (!embedded) ...[
              const SizedBox(height: 14),
              Text(
                'Daily tasks',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 6),
            ] else ...[
              const SizedBox(height: 10),
              Text(
                'Today',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
              ),
              const SizedBox(height: 4),
            ],
            ..._taskTiles(context, ref, state, embedded),
          ],
        ),
      ),
    );
  }

  List<Widget> _taskTiles(
    BuildContext context,
    WidgetRef ref,
    GamificationState state,
    bool compact,
  ) {
    final raw = state.tasksState['tasks'];
    if (raw is! List || raw.isEmpty) {
      return [
        Text(
          'Check sensors and follow tips below to earn XP.',
          style: TextStyle(color: AppColors.textMuted, fontSize: compact ? 12 : 14),
        ),
      ];
    }
    final tiles = raw.map<Widget>((item) {
      if (item is! Map) {
        return const SizedBox.shrink();
      }
      final m = Map<String, dynamic>.from(item);
      final id = m['id']?.toString() ?? '';
      final title = m['title']?.toString() ?? 'Task';
      final xpReward = (m['xpReward'] as num?)?.round() ?? 10;
      final done = m['completed'] == true;
      return Padding(
        padding: EdgeInsets.only(bottom: compact ? 6 : 8),
        child: ListTile(
          dense: compact,
          visualDensity: compact ? VisualDensity.compact : null,
          tileColor: AppColors.surfaceMuted,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          leading: Icon(
            done ? Icons.check_circle : Icons.radio_button_unchecked,
            color: done ? AppColors.green500 : AppColors.textMuted,
            size: compact ? 20 : 24,
          ),
          title: Text(title, style: TextStyle(fontSize: compact ? 13 : null)),
          subtitle: Text('+$xpReward XP', style: TextStyle(fontSize: compact ? 11 : null)),
          trailing: done
              ? null
              : TextButton(
                  onPressed: () async {
                    var event = 'check_system_health';
                    if (id == 'water_today') {
                      event = 'water_on_time';
                    }
                    await ref.read(cropRepositoryProvider).syncGamification(event: event);
                    ref.invalidate(gamificationProvider);
                  },
                  child: const Text('Done'),
                ),
        ),
      );
    }).toList();
    if (compact && tiles.length > 3) {
      return [
        SizedBox(
          height: 168,
          child: ListView(children: tiles),
        ),
      ];
    }
    return tiles;
  }
}
