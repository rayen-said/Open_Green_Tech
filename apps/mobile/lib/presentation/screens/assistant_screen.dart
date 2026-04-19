import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/alert_item.dart';
import '../../data/models/device.dart';
import '../providers/app_providers.dart';
import '../widgets/gamification_widget.dart';

/// Primary “farming buddy” home: guidance-first instead of charts-first.
class AssistantScreen extends ConsumerWidget {
  const AssistantScreen({super.key});

  static String _firstName(String fullName) {
    final t = fullName.trim();
    if (t.isEmpty) {
      return 'farmer';
    }
    return t.split(RegExp(r'\s+')).first;
  }

  static String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) {
      return 'Good morning';
    }
    if (h < 17) {
      return 'Good afternoon';
    }
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authNotifierProvider).value;
    final name = auth?.user.fullName ?? 'there';
    final devicesAsync = ref.watch(devicesProvider);
    final selectedId = ref.watch(selectedDeviceIdProvider);
    final telemetryAsync = ref.watch(telemetrySeriesProvider);
    final recommendationsAsync = ref.watch(recommendationsProvider);
    final alertsAsync = ref.watch(alertsProvider);
    final anomaly = ref.watch(anomalySummaryProvider);
    final profileAsync = ref.watch(farmerProfileProvider);

    final healthLine = telemetryAsync.maybeWhen(
      data: (pts) {
        if (pts.isEmpty) {
          return 'Connect a device to start tracking soil and air conditions.';
        }
        if (anomaly.anomalyRate > 0.15) {
          return 'Some readings look unusual — review alerts below.';
        }
        return 'Sensor data looks steady. Keep up the great work.';
      },
      orElse: () => 'Loading your crop signals…',
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your buddy'),
        actions: [
          IconButton(
            tooltip: 'Sync',
            onPressed: () async {
              await ref.read(syncRepositoryProvider).syncNow();
              ref.invalidate(devicesProvider);
              ref.invalidate(telemetrySeriesProvider);
              ref.invalidate(recommendationsProvider);
              ref.invalidate(alertsProvider);
              ref.invalidate(farmerProfileProvider);
              ref.invalidate(gamificationProvider);
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
                  return const Text('No devices yet — add one from the web app.');
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
          ref.invalidate(farmerProfileProvider);
          ref.invalidate(gamificationProvider);
          await ref.read(syncRepositoryProvider).syncNow();
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            const GamificationWidget(embedded: true),
            const SizedBox(height: 16),
            _Bubble(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_greeting()}, ${_firstName(name)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(healthLine),
                  const SizedBox(height: 4),
                  Text(
                    'Reliability score: ${(anomaly.sensorReliability * 100).round()}%',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Daily insights',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            recommendationsAsync.when(
              data: (list) {
                if (list.isEmpty) {
                  return _Bubble(
                    child: Text(
                      'No AI recommendations yet. Pull to refresh or generate new advice.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  );
                }
                return Column(
                  children: list.take(4).map((r) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _Bubble(
                        alignRight: false,
                        accent: AppColors.green500.withValues(alpha: 0.12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              r.title,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 4),
                            Text(r.explanation),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Recommendations: $e'),
            ),
            const SizedBox(height: 8),
            if (selectedId != null && selectedId.isNotEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () async {
                    await ref.read(cropRepositoryProvider).generateRecommendations(selectedId);
                    ref.invalidate(recommendationsProvider);
                  },
                  icon: const Icon(Icons.auto_awesome, size: 18),
                  label: const Text('Refresh AI advice'),
                ),
              ),
            const SizedBox(height: 8),
            Text(
              'Suggested actions',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            profileAsync.when(
              data: (p) => _ActionSuggestions(profileWatering: p.habits['wateringFrequency']?.toString()),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 12),
            Text(
              'Alerts',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            alertsAsync.when(
              data: (alerts) {
                final open = alerts.where((a) => !a.acknowledged).take(5).toList();
                if (open.isEmpty) {
                  return _Bubble(
                    child: Text(
                      'No open warnings. You are all clear.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  );
                }
                return Column(
                  children: open.map((a) => _AlertTile(alert: a)).toList(),
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Alerts: $e'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionSuggestions extends StatelessWidget {
  const _ActionSuggestions({this.profileWatering});

  final String? profileWatering;

  @override
  Widget build(BuildContext context) {
    final water = profileWatering ?? 'daily';
    final first = water == 'daily'
        ? const _ActionData(
            Icons.water_drop,
            'Water today',
            'Your profile says daily watering — give plants a drink if dry.',
          )
        : const _ActionData(
            Icons.water_drop_outlined,
            'Watering check',
            'Peek at soil moisture and irrigation for today.',
          );
    final cards = <_ActionData>[
      first,
      const _ActionData(
        Icons.cloud_outlined,
        'Humidity',
        'Stable humidity helps transpiration — ventilate if needed.',
      ),
      const _ActionData(
        Icons.compost,
        'Nutrients',
        'Plan fertilizer based on growth stage and soil tests.',
      ),
    ];
    return Column(
      children: cards
          .map(
            (c) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Card(
                child: ListTile(
                  leading: Icon(c.icon, color: AppColors.green500),
                  title: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(c.body),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ActionData {
  const _ActionData(this.icon, this.title, this.body);

  final IconData icon;
  final String title;
  final String body;
}

class _Bubble extends StatelessWidget {
  const _Bubble({
    required this.child,
    this.alignRight = false,
    this.accent,
  });

  final Widget child;
  final bool alignRight;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignRight ? Alignment.centerRight : Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: accent ?? AppColors.surfaceMuted,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(alignRight ? 18 : 4),
            bottomRight: Radius.circular(alignRight ? 4 : 18),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          child: DefaultTextStyle.merge(
            style: Theme.of(context).textTheme.bodyMedium!,
            child: child,
          ),
        ),
      ),
    );
  }
}

class _AlertTile extends ConsumerWidget {
  const _AlertTile({required this.alert});

  final AlertItem alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sev = alert.severity.toUpperCase();
    final color = sev == 'HIGH' || sev == 'CRITICAL'
        ? AppColors.danger
        : AppColors.textMuted;
    return Card(
      child: ListTile(
        leading: Icon(Icons.warning_amber_rounded, color: color),
        title: Text(alert.title),
        subtitle: Text(alert.message),
        trailing: TextButton(
          onPressed: () async {
            await ref.read(cropRepositoryProvider).acknowledgeAlert(alert.id);
            ref.invalidate(alertsProvider);
          },
          child: const Text('OK'),
        ),
      ),
    );
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
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final effective =
        value != null && devices.any((d) => d.id == value) ? value! : devices.first.id;
    return DropdownButtonFormField<String>(
      key: ValueKey(effective),
      initialValue: effective,
      isExpanded: true,
      decoration: const InputDecoration(
        labelText: 'Plot / device',
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
