/// Derived client-side view for “system health” (no dedicated `/anomaly` route in API).
class AnomalySummary {
  const AnomalySummary({
    required this.sampleCount,
    required this.anomalyCount,
    required this.anomalyRate,
    required this.sensorReliability,
    required this.lastUpdated,
  });

  final int sampleCount;
  final int anomalyCount;
  final double anomalyRate;
  /// Heuristic 0–1 score: higher is more trustworthy given variance in readings.
  final double sensorReliability;
  final DateTime? lastUpdated;

  double get anomalyPercent => anomalyRate * 100;
}
