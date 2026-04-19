import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../providers/app_providers.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(recommendationsProvider);
    final deviceId = ref.watch(selectedDeviceIdProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Insights'),
        actions: [
          TextButton.icon(
            onPressed: deviceId == null || deviceId.isEmpty
                ? null
                : () async {
                    await ref
                        .read(cropRepositoryProvider)
                        .generateRecommendations(deviceId);
                    await ref.read(cropRepositoryProvider).syncGamification(
                          event: 'follow_recommendation',
                        );
                    ref.invalidate(recommendationsProvider);
                    ref.invalidate(gamificationProvider);
                  },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate'),
          ),
        ],
      ),
      body: async.when(
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'No recommendations for this device yet. Tap Generate to call POST /recommendations/generate.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted),
                ),
              ),
            );
          }
          final warnings = <String>[];
          for (final r in items) {
            for (final issue in r.detectedIssues) {
              if (issue.startsWith('ai_warning:')) {
                warnings.add(issue.substring('ai_warning:'.length));
              }
            }
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (warnings.isNotEmpty)
                Card(
                  color: AppColors.surfaceMuted,
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AI warnings',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.danger,
                              ),
                        ),
                        const SizedBox(height: 6),
                        ...warnings.map(
                          (w) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text('• $w', style: const TextStyle(fontSize: 13)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (warnings.isNotEmpty) const SizedBox(height: 10),
              ...List.generate(items.length, (i) {
                final r = items[i];
                final issues = r.detectedIssues
                    .where((e) => !e.startsWith('ai_warning:'))
                    .toList();
                return Padding(
                  padding: EdgeInsets.only(bottom: i == items.length - 1 ? 0 : 10),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r.title,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            r.explanation,
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '${r.type} · confidence ${r.confidence}%',
                            style: TextStyle(
                              color: AppColors.earth500,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (issues.isNotEmpty)
                            Text(
                              'Issues: ${issues.map((e) => e.replaceAll('_', ' ')).join(', ')}',
                              style: const TextStyle(fontSize: 12),
                            ),
                          const SizedBox(height: 4),
                          Text(
                            'Why: ${r.reason}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
      ),
    );
  }
}
