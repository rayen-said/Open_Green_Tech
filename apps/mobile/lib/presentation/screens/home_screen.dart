import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/recommendations_provider.dart';
import '../providers/telemetry_provider.dart';
import '../widgets/anomaly_indicator.dart';
import '../widgets/metric_tile.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final telemetryAsync = ref.watch(telemetryNotifierProvider);
    final recommendationsAsync = ref.watch(recommendationsNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Crop Advisor'),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(telemetryNotifierProvider.notifier).refresh();
              await ref
                  .read(recommendationsNotifierProvider.notifier)
                  .refresh();
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(telemetryNotifierProvider.notifier).refresh();
          await ref.read(recommendationsNotifierProvider.notifier).refresh();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            telemetryAsync.when(
              data: (telemetry) {
                return Column(
                  children: [
                    MetricTile(
                      label: 'Temperature',
                      value: '${telemetry.temperature.toStringAsFixed(1)} C',
                      icon: Icons.thermostat,
                    ),
                    MetricTile(
                      label: 'Humidity',
                      value: '${telemetry.humidity.toStringAsFixed(1)}%',
                      icon: Icons.water_drop,
                    ),
                    MetricTile(
                      label: 'Light',
                      value: '${telemetry.light.toStringAsFixed(0)} lux',
                      icon: Icons.wb_sunny,
                    ),
                    AnomalyIndicator(score: telemetry.anomalyScore),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'System Alerts',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            if (telemetry.alerts.isEmpty)
                              const Text('No active alerts.')
                            else
                              ...telemetry.alerts.map(
                                (alert) => ListTile(
                                  dense: true,
                                  contentPadding: EdgeInsets.zero,
                                  leading: const Icon(
                                    Icons.warning_amber_rounded,
                                    color: Colors.orange,
                                  ),
                                  title: Text(alert),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stack) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Telemetry error: $error'),
                ),
              ),
            ),
            const SizedBox(height: 12),
            recommendationsAsync.when(
              data: (recommendation) => Card(
                child: ListTile(
                  title: const Text('Crop Health Summary'),
                  subtitle: Text(recommendation.cropHealth),
                ),
              ),
              loading: () => const SizedBox.shrink(),
              error: (error, stack) => Card(
                child: ListTile(
                  title: const Text('Recommendation unavailable'),
                  subtitle: Text(error.toString()),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
