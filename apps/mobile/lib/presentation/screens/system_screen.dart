import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/app_providers.dart';
import '../providers/telemetry_provider.dart';

class SystemScreen extends ConsumerWidget {
  const SystemScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onlineAsync = ref.watch(connectivityStatusProvider);
    final historyAsync = ref.watch(telemetryHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('System')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.cloud_done_outlined),
              title: const Text('Connectivity Status'),
              subtitle: onlineAsync.when(
                data: (online) => Text(online ? 'Online' : 'Offline'),
                loading: () => const Text('Checking...'),
                error: (error, stack) => const Text('Unknown'),
              ),
            ),
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Anomaly Trend (latest samples)',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  historyAsync.when(
                    data: (history) {
                      if (history.isEmpty) {
                        return const Text('No telemetry history yet.');
                      }

                      return Column(
                        children: history.take(8).map((entry) {
                          final score = entry.anomalyScore.clamp(0, 1);
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    '${entry.timestamp.hour.toString().padLeft(2, '0')}:${entry.timestamp.minute.toString().padLeft(2, '0')}',
                                  ),
                                ),
                                Expanded(
                                  flex: 8,
                                  child: LinearProgressIndicator(
                                    value: score.toDouble(),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                SizedBox(
                                  width: 44,
                                  child: Text(
                                    '${(score * 100).toStringAsFixed(0)}%',
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      );
                    },
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (error, stack) =>
                        Text('Failed to load history: $error'),
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
