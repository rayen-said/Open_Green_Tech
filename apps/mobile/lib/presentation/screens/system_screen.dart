import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/telemetry_point.dart';
import '../providers/app_providers.dart';

class SystemScreen extends ConsumerWidget {
  const SystemScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onlineAsync = ref.watch(connectivityStatusProvider);
    final seriesAsync = ref.watch(telemetrySeriesProvider);
    final anomaly = ref.watch(anomalySummaryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('System health')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.cloud_outlined),
              title: const Text('Connectivity'),
              subtitle: onlineAsync.when(
                data: (online) => Text(online ? 'Online' : 'Offline'),
                loading: () => const Text('Checking…'),
                error: (_, __) => const Text('Unknown'),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Anomaly score trend',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${anomaly.anomalyPercent.toStringAsFixed(0)}% of last ${anomaly.sampleCount} samples flagged · reliability ${(anomaly.sensorReliability * 100).toStringAsFixed(0)}%',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  seriesAsync.when(
                    data: (series) => _AnomalyBars(series: series),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Text('$e'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sensor reliability',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      minHeight: 14,
                      value: anomaly.sensorReliability.clamp(0.0, 1.0),
                      color: AppColors.green500,
                      backgroundColor: AppColors.bgSoft,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Heuristic from temperature variance across cached telemetry (offline-first).',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
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

class _AnomalyBars extends StatelessWidget {
  const _AnomalyBars({required this.series});

  final List<TelemetryPoint> series;

  @override
  Widget build(BuildContext context) {
    if (series.isEmpty) {
      return Text(
        'No samples yet.',
        style: TextStyle(color: AppColors.textMuted),
      );
    }
    final sorted = [...series]..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    final window = sorted.length > 16 ? sorted.sublist(sorted.length - 16) : sorted;
    final spots = <BarChartGroupData>[];
    for (var i = 0; i < window.length; i++) {
      final p = window[i];
      spots.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: p.anomaly ? 1 : 0.08,
              width: 10,
              borderRadius: BorderRadius.circular(4),
              color: p.anomaly ? AppColors.danger : AppColors.green500.withValues(alpha: 0.35),
            ),
          ],
        ),
      );
    }
    return SizedBox(
      height: 180,
      child: BarChart(
        BarChartData(
          maxY: 1.2,
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: const FlTitlesData(show: false),
          barGroups: spots,
        ),
      ),
    );
  }
}
