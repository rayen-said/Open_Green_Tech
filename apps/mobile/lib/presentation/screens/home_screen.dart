import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/device.dart';
import '../../data/models/recommendation_item.dart';
import '../../data/models/telemetry_point.dart';
import '../providers/app_providers.dart';
import '../widgets/anomaly_indicator.dart';
import '../widgets/metric_tile.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devicesAsync = ref.watch(devicesProvider);
    final selectedId = ref.watch(selectedDeviceIdProvider);
    final telemetryAsync = ref.watch(telemetrySeriesProvider);
    final alertsAsync = ref.watch(alertsProvider);
    final recommendationsAsync = ref.watch(recommendationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(syncRepositoryProvider).syncNow();
            },
            icon: const Icon(Icons.sync),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: devicesAsync.when(
              data: (devices) {
                if (devices.isEmpty) {
                  return const Text('No devices — add one in the web app.');
                }
                return _DevicePicker(
                  devices: devices,
                  value: selectedId,
                  onChanged: (id) {
                    ref.read(selectedDeviceIdProvider.notifier).set(id);
                  },
                );
              },
              loading: () => const LinearProgressIndicator(minHeight: 2),
              error: (e, _) => Text('Devices: $e'),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(devicesProvider);
          ref.invalidate(telemetrySeriesProvider);
          ref.invalidate(recommendationsProvider);
          ref.invalidate(alertsProvider);
          await ref.read(syncRepositoryProvider).syncNow();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            telemetryAsync.when(
              data: (series) {
                final latest = _latestPoint(series);
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        MetricTile(
                          label: 'Temperature',
                          value: latest == null
                              ? '--'
                              : '${latest.temperature.toStringAsFixed(1)} °C',
                          icon: Icons.thermostat,
                        ),
                        MetricTile(
                          label: 'Humidity',
                          value: latest == null
                              ? '--'
                              : '${latest.humidity.toStringAsFixed(1)} %',
                          icon: Icons.water_drop_outlined,
                        ),
                        MetricTile(
                          label: 'Light',
                          value: latest == null
                              ? '--'
                              : latest.light.toStringAsFixed(0),
                          icon: Icons.wb_sunny_outlined,
                        ),
                        MetricTile(
                          label: 'Anomaly',
                          value: latest == null
                              ? '--'
                              : (latest.anomaly ? 'Risk' : 'Healthy'),
                          icon: Icons.shield_moon_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (latest != null)
                      AnomalyIndicator(anomaly: latest.anomaly),
                    const SizedBox(height: 12),
                    _TelemetryChart(points: series),
                  ],
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Card(
                child: ListTile(
                  title: const Text('Telemetry'),
                  subtitle: Text('$e'),
                ),
              ),
            ),
            const SizedBox(height: 12),
            alertsAsync.when(
              data: (alerts) {
                final open = alerts.where((a) => !a.acknowledged).take(4).toList();
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Key alerts',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 8),
                        if (open.isEmpty)
                          Text(
                            'No open alerts.',
                            style: TextStyle(color: AppColors.textMuted),
                          )
                        else
                          ...open.map(
                            (a) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              dense: true,
                              leading: Icon(
                                Icons.notifications_active_outlined,
                                color: a.severity == 'CRITICAL'
                                    ? AppColors.danger
                                    : AppColors.earth500,
                              ),
                              title: Text(a.title),
                              subtitle: Text(a.message),
                              trailing: TextButton(
                                onPressed: () async {
                                  await ref
                                      .read(cropRepositoryProvider)
                                      .acknowledgeAlert(a.id);
                                  ref.invalidate(alertsProvider);
                                },
                                child: const Text('Ack'),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (e, _) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 12),
            recommendationsAsync.when(
              data: (List<RecommendationItem> recs) {
                RecommendationItem? first;
                final cropHealth =
                    recs.where((r) => r.type == 'CROP_HEALTH').toList();
                if (cropHealth.isNotEmpty) {
                  first = cropHealth.first;
                } else if (recs.isNotEmpty) {
                  first = recs.first;
                }
                if (first == null) {
                  return Card(
                    child: ListTile(
                      title: const Text('Crop health summary'),
                      subtitle: Text(
                        'No recommendations yet. Generate from the web dashboard or Insights tab.',
                        style: TextStyle(color: AppColors.textMuted),
                      ),
                    ),
                  );
                }
                return Card(
                  child: ListTile(
                    title: Text(first.title),
                    subtitle: Text(first.explanation),
                  ),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (e, _) => const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  TelemetryPoint? _latestPoint(List<TelemetryPoint> series) {
    if (series.isEmpty) {
      return null;
    }
    final sorted = [...series]
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return sorted.first;
  }
}

class _DevicePicker extends StatelessWidget {
  const _DevicePicker({
    required this.devices,
    required this.value,
    required this.onChanged,
  });

  final List<Device> devices;
  final String? value;
  final void Function(String?) onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      key: ValueKey(
        '${value ?? 'none'}|${devices.map((d) => d.id).join('|')}',
      ),
      initialValue:
          value != null && devices.any((d) => d.id == value) ? value : null,
      decoration: const InputDecoration(
        labelText: 'Device',
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: devices
          .map(
            (d) => DropdownMenuItem(
              value: d.id,
              child: Text(d.name, overflow: TextOverflow.ellipsis),
            ),
          )
          .toList(),
      onChanged: onChanged,
    );
  }
}

class _TelemetryChart extends StatelessWidget {
  const _TelemetryChart({required this.points});

  final List<TelemetryPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.length < 2) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Not enough telemetry samples for a chart yet.',
            style: TextStyle(color: AppColors.textMuted),
          ),
        ),
      );
    }
    final sorted = [...points]..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    final last = sorted.length > 20 ? sorted.sublist(sorted.length - 20) : sorted;

    LineChartBarData line(Color color, List<FlSpot> spots) {
      return LineChartBarData(
        spots: spots,
        isCurved: true,
        barWidth: 2,
        color: color,
        dotData: const FlDotData(show: false),
      );
    }

    final tSpots = <FlSpot>[];
    final hSpots = <FlSpot>[];
    final lSpots = <FlSpot>[];
    for (var i = 0; i < last.length; i++) {
      final p = last[i];
      final x = i.toDouble();
      tSpots.add(FlSpot(x, p.temperature));
      hSpots.add(FlSpot(x, p.humidity));
      lSpots.add(FlSpot(x, p.light / 20));
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
        child: SizedBox(
          height: 220,
          child: LineChart(
            LineChartData(
              gridData: const FlGridData(show: true),
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 22,
                    getTitlesWidget: (v, m) {
                      final i = v.round();
                      if (i < 0 || i >= last.length) {
                        return const SizedBox.shrink();
                      }
                      final t = last[i].timestamp.toLocal();
                      return Text(
                        '${t.hour}:${t.minute.toString().padLeft(2, '0')}',
                        style: const TextStyle(fontSize: 9),
                      );
                    },
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 32,
                    getTitlesWidget: (v, m) => Text(
                      v.toStringAsFixed(0),
                      style: const TextStyle(fontSize: 9),
                    ),
                  ),
                ),
                topTitles: const AxisTitles(),
                rightTitles: const AxisTitles(),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                line(AppColors.chartTemp, tSpots),
                line(AppColors.chartHumidity, hSpots),
                line(AppColors.chartLight, lSpots),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
