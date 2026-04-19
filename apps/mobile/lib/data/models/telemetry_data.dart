import 'package:hive/hive.dart';

class TelemetryData {
  const TelemetryData({
    required this.temperature,
    required this.humidity,
    required this.light,
    required this.anomalyScore,
    required this.alerts,
    required this.timestamp,
  });

  final double temperature;
  final double humidity;
  final double light;
  final double anomalyScore;
  final List<String> alerts;
  final DateTime timestamp;

  Map<String, dynamic> toJson() {
    return {
      'temperature': temperature,
      'humidity': humidity,
      'light': light,
      'anomalyScore': anomalyScore,
      'alerts': alerts,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory TelemetryData.fromJson(Map<String, dynamic> json) {
    return TelemetryData(
      temperature: (json['temperature'] as num?)?.toDouble() ?? 0,
      humidity: (json['humidity'] as num?)?.toDouble() ?? 0,
      light: (json['light'] as num?)?.toDouble() ?? 0,
      anomalyScore: (json['anomalyScore'] as num?)?.toDouble() ?? 0,
      alerts: ((json['alerts'] as List?) ?? const [])
          .map((item) => item.toString())
          .toList(),
      timestamp:
          DateTime.tryParse(json['timestamp']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class TelemetryDataAdapter extends TypeAdapter<TelemetryData> {
  static const int typeIdValue = 1;

  @override
  final int typeId = typeIdValue;

  @override
  TelemetryData read(BinaryReader reader) {
    final temperature = reader.readDouble();
    final humidity = reader.readDouble();
    final light = reader.readDouble();
    final anomalyScore = reader.readDouble();
    final alerts = (reader.readList()).cast<String>();
    final timestampMs = reader.readInt();

    return TelemetryData(
      temperature: temperature,
      humidity: humidity,
      light: light,
      anomalyScore: anomalyScore,
      alerts: alerts,
      timestamp: DateTime.fromMillisecondsSinceEpoch(timestampMs),
    );
  }

  @override
  void write(BinaryWriter writer, TelemetryData obj) {
    writer
      ..writeDouble(obj.temperature)
      ..writeDouble(obj.humidity)
      ..writeDouble(obj.light)
      ..writeDouble(obj.anomalyScore)
      ..writeList(obj.alerts)
      ..writeInt(obj.timestamp.millisecondsSinceEpoch);
  }
}
