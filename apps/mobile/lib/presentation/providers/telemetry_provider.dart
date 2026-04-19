import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/telemetry_data.dart';
import 'app_providers.dart';

final telemetryNotifierProvider =
    AsyncNotifierProvider<TelemetryNotifier, TelemetryData>(
      TelemetryNotifier.new,
    );

final telemetryHistoryProvider = FutureProvider<List<TelemetryData>>((ref) {
  return ref.read(telemetryRepositoryProvider).history(limit: 20);
});

class TelemetryNotifier extends AsyncNotifier<TelemetryData> {
  @override
  Future<TelemetryData> build() async {
    return _load();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_load);
    ref.invalidate(telemetryHistoryProvider);
  }

  Future<TelemetryData> _load() async {
    final online = await ref.read(connectivityServiceProvider).isOnline();
    return ref.read(telemetryRepositoryProvider).fetchLatest(online: online);
  }
}
