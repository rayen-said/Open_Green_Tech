import 'dart:math';

import '../models/recommendation_data.dart';
import '../models/telemetry_data.dart';
import '../models/user_profile.dart';

class MockDataService {
  final Random _random;

  MockDataService({Random? random}) : _random = random ?? Random();

  TelemetryData generateTelemetry() {
    final anomaly = _random.nextDouble();
    final alerts = <String>[];

    if (anomaly > 0.8) {
      alerts.add('High anomaly detected in sensor pattern.');
    }
    if (anomaly > 0.65) {
      alerts.add('Irrigation system should be checked.');
    }

    return TelemetryData(
      temperature: 22 + (_random.nextDouble() * 12),
      humidity: 45 + (_random.nextDouble() * 35),
      light: 350 + (_random.nextDouble() * 450),
      anomalyScore: anomaly,
      alerts: alerts,
      timestamp: DateTime.now(),
    );
  }

  RecommendationData generateRecommendations(UserProfile profile) {
    final soil = profile.soilType.toLowerCase();
    final cropHealth = _random.nextDouble() > 0.4 ? 'Good' : 'Watch closely';

    String irrigation = 'Use drip irrigation for 20 minutes at dusk.';
    if (soil.contains('sandy')) {
      irrigation = 'Increase irrigation frequency by 10% for sandy soil.';
    }

    String fertilizer = 'Apply balanced NPK (10-10-10) this week.';
    if (soil.contains('clay')) {
      fertilizer = 'Use low nitrogen blend and improve soil aeration.';
    }

    return RecommendationData(
      cropHealth: cropHealth,
      irrigation: irrigation,
      fertilizer: fertilizer,
      cropSuggestions: const ['Maize', 'Tomato', 'Groundnut'],
      generatedAt: DateTime.now(),
    );
  }
}
