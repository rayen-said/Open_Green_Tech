import 'dart:async';

import '../../core/config/env_config.dart';
import '../services/connectivity_service.dart';
import 'crop_repository.dart';

class SyncRepository {
  SyncRepository({
    required ConnectivityService connectivity,
    required CropRepository repository,
    required void Function() onSynced,
    required String? Function() selectedDeviceId,
  })  : _connectivity = connectivity,
        _repository = repository,
        _onSynced = onSynced,
        _selectedDeviceId = selectedDeviceId;

  final ConnectivityService _connectivity;
  final CropRepository _repository;
  final void Function() _onSynced;
  final String? Function() _selectedDeviceId;

  StreamSubscription<bool>? _subscription;
  Timer? _timer;

  void start() {
    _subscription ??= _connectivity.statusStream.listen((online) async {
      if (!online) {
        return;
      }
      await syncNow();
    });
    _timer ??= Timer.periodic(const Duration(minutes: 2), (_) async {
      if (await _connectivity.isOnline()) {
        await syncNow();
      }
    });
  }

  Future<void> syncNow() async {
    final id = _selectedDeviceId();
    await _repository.loadDevices();
    if (id != null && id.isNotEmpty) {
      await _repository.loadTelemetrySeries(id);
      await _repository.loadRecommendations(id);
    }
    await _repository.loadAlerts();
    if (!EnvConfig.instance.mockMode) {
      try {
        await _repository.loadUser();
      } catch (_) {
        // Offline or session expired — cache path already handled in repository.
      }
      try {
        await _repository.loadFarmerProfile();
      } catch (_) {}
      try {
        await _repository.loadGamification();
      } catch (_) {}
    }
    _onSynced();
  }

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
    _timer?.cancel();
    _timer = null;
  }
}
