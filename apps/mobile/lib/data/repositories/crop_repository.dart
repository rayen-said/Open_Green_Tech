import '../../core/config/env_config.dart';
import '../models/alert_item.dart';
import '../models/auth_user.dart';
import '../models/device.dart';
import '../models/recommendation_item.dart';
import '../models/telemetry_point.dart';
import '../offline/offline_store.dart';
import '../services/alerts_service.dart';
import '../services/connectivity_service.dart';
import '../services/devices_service.dart';
import '../services/mock_data_service.dart';
import '../services/recommendation_service.dart';
import '../services/telemetry_service.dart';
import '../services/user_service.dart';

/// Offline-first coordinator: cache → network refresh when online.
class CropRepository {
  CropRepository({
    required TelemetryService telemetryService,
    required RecommendationService recommendationService,
    required AlertsService alertsService,
    required DevicesService devicesService,
    required UserService userService,
    required ConnectivityService connectivity,
    required MockDataService mockDataService,
    required OfflineStore offline,
  })  : _telemetry = telemetryService,
        _recommendations = recommendationService,
        _alerts = alertsService,
        _devices = devicesService,
        _user = userService,
        _connectivity = connectivity,
        _mock = mockDataService,
        _offline = offline;

  final TelemetryService _telemetry;
  final RecommendationService _recommendations;
  final AlertsService _alerts;
  final DevicesService _devices;
  final UserService _user;
  final ConnectivityService _connectivity;
  final MockDataService _mock;
  final OfflineStore _offline;

  bool get _mockMode => EnvConfig.instance.mockMode;

  Future<bool> get _online => _connectivity.isOnline();

  Future<List<Device>> loadDevices() async {
    if (_mockMode) {
      final list = _mock.devices();
      await _offline.saveDevices(list);
      return list;
    }
    final cached = _offline.readDevices();
    if (!await _online) {
      return cached;
    }
    try {
      final fresh = await _devices.list();
      await _offline.saveDevices(fresh);
      return fresh;
    } catch (_) {
      return cached;
    }
  }

  Future<AuthUser> loadUser() async {
    if (_mockMode) {
      final u = _mock.demoUser();
      await _offline.saveUser(u);
      return u;
    }
    final cached = _offline.readUser();
    if (!await _online) {
      if (cached != null) {
        return cached;
      }
      throw StateError('No cached user while offline.');
    }
    try {
      final u = await _user.me();
      await _offline.saveUser(u);
      return u;
    } catch (_) {
      if (cached != null) {
        return cached;
      }
      rethrow;
    }
  }

  Future<List<TelemetryPoint>> loadTelemetrySeries(String deviceId) async {
    if (deviceId.isEmpty) {
      return const [];
    }
    if (_mockMode) {
      final series = _mock.telemetrySeries(deviceId);
      await _offline.saveTelemetry(deviceId, series);
      return series;
    }
    final cached = _offline.readTelemetry(deviceId);
    if (!await _online) {
      return cached;
    }
    try {
      final fresh = await _telemetry.fetchSeries(deviceId);
      await _offline.saveTelemetry(deviceId, fresh);
      return fresh;
    } catch (_) {
      return cached;
    }
  }

  Future<List<TelemetryPoint>> loadLatestAcrossDevices() async {
    if (_mockMode) {
      final d = _mock.devices().first;
      return _mock.telemetrySeries(d.id).take(1).toList();
    }
    if (!await _online) {
      return const [];
    }
    try {
      return _telemetry.fetchLatestPerDevice();
    } catch (_) {
      return const [];
    }
  }

  Future<List<RecommendationItem>> loadRecommendations(String deviceId) async {
    if (deviceId.isEmpty) {
      return const [];
    }
    if (_mockMode) {
      final list = _mock.recommendations();
      await _offline.saveRecommendations(deviceId, list);
      return list;
    }
    final cached = _offline.readRecommendations(deviceId);
    if (!await _online) {
      return cached;
    }
    try {
      final fresh = await _recommendations.list(deviceId);
      await _offline.saveRecommendations(deviceId, fresh);
      return fresh;
    } catch (_) {
      return cached;
    }
  }

  Future<List<RecommendationItem>> generateRecommendations(String deviceId) async {
    if (_mockMode) {
      return loadRecommendations(deviceId);
    }
    final fresh = await _recommendations.generate(deviceId);
    await _offline.saveRecommendations(deviceId, fresh);
    return fresh;
  }

  Future<List<AlertItem>> loadAlerts() async {
    if (_mockMode) {
      final list = _mock.alerts();
      await _offline.saveAlerts(list);
      return list;
    }
    final cached = _offline.readAlerts();
    if (!await _online) {
      return cached;
    }
    try {
      final fresh = await _alerts.list();
      await _offline.saveAlerts(fresh);
      return fresh;
    } catch (_) {
      return cached;
    }
  }

  Future<void> acknowledgeAlert(String id) async {
    if (_mockMode) {
      return;
    }
    if (await _online) {
      await _alerts.acknowledge(id);
    }
    final local = _offline.readAlerts().map((a) {
      if (a.id == id) {
        return AlertItem(
          id: a.id,
          severity: a.severity,
          title: a.title,
          message: a.message,
          acknowledged: true,
          createdAt: a.createdAt,
          deviceId: a.deviceId,
          deviceName: a.deviceName,
        );
      }
      return a;
    }).toList();
    await _offline.saveAlerts(local);
  }

  Future<Device> patchDevice({
    required String deviceId,
    String? location,
    String? soilType,
    String? cropType,
  }) async {
    if (_mockMode) {
      final devices = _offline.readDevices();
      final idx = devices.indexWhere((d) => d.id == deviceId);
      if (idx == -1) {
        throw StateError('Unknown device');
      }
      final prev = devices[idx];
      final next = Device(
        id: prev.id,
        name: prev.name,
        location: location ?? prev.location,
        soilType: soilType ?? prev.soilType,
        cropType: cropType ?? prev.cropType,
        status: prev.status,
        ownerId: prev.ownerId,
      );
      devices[idx] = next;
      await _offline.saveDevices(devices);
      return next;
    }
    final updated = await _user.updateDeviceProfile(
      deviceId: deviceId,
      location: location,
      soilType: soilType,
      cropType: cropType,
    );
    final list = _offline.readDevices();
    final i = list.indexWhere((d) => d.id == deviceId);
    if (i != -1) {
      list[i] = updated;
      await _offline.saveDevices(list);
    }
    return updated;
  }
}
