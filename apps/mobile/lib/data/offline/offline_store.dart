import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

import '../models/alert_item.dart';
import '../models/auth_user.dart';
import '../models/device.dart';
import '../models/recommendation_item.dart';
import '../models/telemetry_point.dart';

/// Hive-backed JSON cache for offline-first reads (no per-model TypeAdapters).
class OfflineStore {
  OfflineStore._();

  static final OfflineStore instance = OfflineStore._();

  static const _boxName = 'crop_advisor_json_v1';

  Box<String>? _box;

  Future<void> init() async {
    _box = await Hive.openBox<String>(_boxName);
  }

  Box<String> get _b {
    final b = _box;
    if (b == null) {
      throw StateError('OfflineStore.init() not called');
    }
    return b;
  }

  static String keyDevices() => 'devices';
  static String keySelectedDevice() => 'selected_device_id';
  static String keyTelemetry(String deviceId) => 'telemetry_$deviceId';
  static String keyRecommendations(String deviceId) => 'recommendations_$deviceId';
  static String keyAlerts() => 'alerts';
  static String keyUser() => 'auth_user';

  Future<void> saveDevices(List<Device> devices) async {
    await _b.put(
      keyDevices(),
      jsonEncode(devices.map((e) => e.toJson()).toList()),
    );
  }

  List<Device> readDevices() {
    final raw = _b.get(keyDevices());
    if (raw == null) {
      return const [];
    }
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Device.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> saveSelectedDeviceId(String? id) async {
    if (id == null || id.isEmpty) {
      await _b.delete(keySelectedDevice());
    } else {
      await _b.put(keySelectedDevice(), id);
    }
  }

  String? readSelectedDeviceId() => _b.get(keySelectedDevice());

  Future<void> saveTelemetry(String deviceId, List<TelemetryPoint> points) async {
    await _b.put(
      keyTelemetry(deviceId),
      jsonEncode(points.map((e) => e.toJson()).toList()),
    );
  }

  List<TelemetryPoint> readTelemetry(String deviceId) {
    final raw = _b.get(keyTelemetry(deviceId));
    if (raw == null) {
      return const [];
    }
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map(
          (e) => TelemetryPoint.fromJson(Map<String, dynamic>.from(e as Map)),
        )
        .toList();
  }

  Future<void> saveRecommendations(
    String deviceId,
    List<RecommendationItem> items,
  ) async {
    await _b.put(
      keyRecommendations(deviceId),
      jsonEncode(items.map((e) => e.toJson()).toList()),
    );
  }

  List<RecommendationItem> readRecommendations(String deviceId) {
    final raw = _b.get(keyRecommendations(deviceId));
    if (raw == null) {
      return const [];
    }
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map(
          (e) =>
              RecommendationItem.fromJson(Map<String, dynamic>.from(e as Map)),
        )
        .toList();
  }

  Future<void> saveAlerts(List<AlertItem> alerts) async {
    await _b.put(
      keyAlerts(),
      jsonEncode(alerts.map((e) => e.toJson()).toList()),
    );
  }

  List<AlertItem> readAlerts() {
    final raw = _b.get(keyAlerts());
    if (raw == null) {
      return const [];
    }
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => AlertItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> saveUser(AuthUser user) async {
    await _b.put(keyUser(), jsonEncode(user.toJson()));
  }

  AuthUser? readUser() {
    final raw = _b.get(keyUser());
    if (raw == null) {
      return null;
    }
    return AuthUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> clearSessionCaches() async {
    await _b.delete(keyDevices());
    await _b.delete(keySelectedDevice());
    await _b.delete(keyAlerts());
    await _b.delete(keyUser());
    // Keep per-device telemetry/recommendation caches for offline demos.
  }
}
