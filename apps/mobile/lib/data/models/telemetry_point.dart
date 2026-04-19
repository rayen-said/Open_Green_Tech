/// Matches `TelemetryPoint` in `apps/web/src/lib/types.ts` and Prisma telemetry rows.
class TelemetryPoint {
  const TelemetryPoint({
    required this.id,
    required this.temperature,
    required this.humidity,
    required this.light,
    required this.anomaly,
    required this.timestamp,
    required this.deviceId,
  });

  final String id;
  final double temperature;
  final double humidity;
  final double light;
  final bool anomaly;
  final DateTime timestamp;
  final String deviceId;

  /// Anomaly intensity in \[0,1\] for charts (boolean telemetry → 0 or 1).
  double get anomalyScore => anomaly ? 1.0 : 0.0;

  Map<String, dynamic> toJson() => {
        'id': id,
        'temperature': temperature,
        'humidity': humidity,
        'light': light,
        'anomaly': anomaly,
        'timestamp': timestamp.toUtc().toIso8601String(),
        'deviceId': deviceId,
      };

  factory TelemetryPoint.fromJson(Map<String, dynamic> json) {
    return TelemetryPoint(
      id: json['id']?.toString() ?? '',
      temperature: (json['temperature'] as num?)?.toDouble() ?? 0,
      humidity: (json['humidity'] as num?)?.toDouble() ?? 0,
      light: (json['light'] as num?)?.toDouble() ?? 0,
      anomaly: json['anomaly'] == true || json['anomaly'] == 'true',
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ??
          DateTime.now().toUtc(),
      deviceId: json['deviceId']?.toString() ?? '',
    );
  }
}
