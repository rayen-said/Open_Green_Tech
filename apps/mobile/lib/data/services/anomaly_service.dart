import '../models/anomaly_summary.dart';
import '../models/telemetry_point.dart';

/// There is no dedicated `/anomaly` route; this service summarizes telemetry.
class AnomalyService {
  AnomalySummary summarizeSeries(List<TelemetryPoint> points) {
    if (points.isEmpty) {
      return AnomalySummary(
        sampleCount: 0,
        anomalyCount: 0,
        anomalyRate: 0,
        sensorReliability: 0.65,
        lastUpdated: null,
      );
    }
    final sorted = [...points]..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    final anomalyCount = sorted.where((p) => p.anomaly).length;
    final rate = anomalyCount / sorted.length;

    // Simple variance-based “sensor reliability” proxy.
    double meanT = 0;
    for (final p in sorted) {
      meanT += p.temperature;
    }
    meanT /= sorted.length;
    var varT = 0.0;
    for (final p in sorted) {
      final d = p.temperature - meanT;
      varT += d * d;
    }
    varT /= sorted.length;
    final spread = varT.clamp(0.0, 25.0);
    final reliability = (0.92 - (spread / 50)).clamp(0.55, 0.98);

    return AnomalySummary(
      sampleCount: sorted.length,
      anomalyCount: anomalyCount,
      anomalyRate: rate,
      sensorReliability: reliability,
      lastUpdated: sorted.last.timestamp,
    );
  }
}
