import 'package:dio/dio.dart';

import '../models/telemetry_point.dart';

/// REST wrapper for `/api/telemetry/*` (see `TelemetryController`).
class TelemetryService {
  TelemetryService(this._dio);

  final Dio _dio;

  /// `GET /telemetry/latest` — per-device latest reading.
  Future<List<TelemetryPoint>> fetchLatestPerDevice() async {
    final res = await _dio.get<List<dynamic>>('telemetry/latest');
    final list = res.data ?? const [];
    final out = <TelemetryPoint>[];
    for (final raw in list) {
      final map = Map<String, dynamic>.from(raw as Map);
      final deviceId = map['id']?.toString() ?? '';
      final latest = map['latest'];
      if (latest is! Map) {
        continue;
      }
      final t = Map<String, dynamic>.from(latest);
      out.add(
        TelemetryPoint.fromJson({
          ...t,
          'deviceId': deviceId.isNotEmpty ? deviceId : t['deviceId'],
        }),
      );
    }
    return out;
  }

  /// `GET /telemetry/:deviceId` — time series (descending from API).
  Future<List<TelemetryPoint>> fetchSeries(String deviceId) async {
    final res = await _dio.get<List<dynamic>>('telemetry/$deviceId');
    final list = res.data ?? const [];
    return list
        .map(
          (e) => TelemetryPoint.fromJson(
            Map<String, dynamic>.from(e as Map),
          ),
        )
        .toList();
  }

  /// `POST /telemetry/:deviceId` — optional field uploads (not used in UI yet).
  Future<void> postReading({
    required String deviceId,
    required double temperature,
    required double humidity,
    required double light,
    required bool anomaly,
  }) async {
    await _dio.post<void>(
      'telemetry/$deviceId',
      data: {
        'temperature': temperature,
        'humidity': humidity,
        'light': light,
        'anomaly': anomaly,
      },
    );
  }
}
