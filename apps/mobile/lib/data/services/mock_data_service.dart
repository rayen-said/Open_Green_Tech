import 'dart:math';

import '../models/alert_item.dart';
import '../models/auth_user.dart';
import '../models/device.dart';
import '../models/farmer_profile.dart';
import '../models/gamification_state.dart';
import '../models/recommendation_item.dart';
import '../models/telemetry_point.dart';

class MockDataService {
  MockDataService({Random? random}) : _r = random ?? Random();

  final Random _r;

  AuthUser demoUser() => const AuthUser(
        id: 'mock-user',
        fullName: 'Demo Grower',
        email: 'demo@open-green.local',
        role: 'USER',
      );

  List<Device> devices() {
    return [
      Device(
        id: 'mock-device-1',
        name: 'North Field Sensor',
        location: '36.8, 10.18',
        soilType: 'Loamy',
        cropType: 'Tomato',
        status: 'ONLINE',
        ownerId: 'mock-user',
      ),
    ];
  }

  List<TelemetryPoint> telemetrySeries(String deviceId) {
    final now = DateTime.now().toUtc();
    return List.generate(24, (i) {
      final t = now.subtract(Duration(minutes: (23 - i) * 15));
      final anomaly = i % 7 == 0;
      return TelemetryPoint(
        id: 'mock-t-$i',
        temperature: 22 + _r.nextDouble() * 8 + (anomaly ? 6 : 0),
        humidity: 40 + _r.nextDouble() * 30,
        light: 200 + _r.nextDouble() * 600,
        anomaly: anomaly,
        timestamp: t,
        deviceId: deviceId,
      );
    });
  }

  List<RecommendationItem> recommendations() {
    final now = DateTime.now().toUtc();
    return [
      RecommendationItem(
        id: 'm1',
        type: 'CROP_HEALTH',
        title: 'Crop condition stable',
        explanation: 'Environmental values are within the healthy range for most crops.',
        reason: 'Telemetry variance is low.',
        detectedIssues: const [],
        confidence: 76,
        createdAt: now,
      ),
      RecommendationItem(
        id: 'm2',
        type: 'IRRIGATION',
        title: 'Maintain current irrigation',
        explanation: 'Humidity levels are acceptable. Keep current irrigation rhythm.',
        reason: 'Humidity above 30%.',
        detectedIssues: const [],
        confidence: 72,
        createdAt: now,
      ),
      RecommendationItem(
        id: 'm3',
        type: 'FERTILIZER',
        title: 'Balanced fertilization plan',
        explanation: 'Current light exposure supports regular fertilization.',
        reason: 'Adequate light hours.',
        detectedIssues: const [],
        confidence: 79,
        createdAt: now,
      ),
      RecommendationItem(
        id: 'm4',
        type: 'BEST_CROP',
        title: 'Mixed crops are suitable',
        explanation: 'Moderate climate allows vegetables and cereals with regular moisture monitoring.',
        reason: 'Temperature band 22–30C.',
        detectedIssues: const [],
        confidence: 73,
        createdAt: now,
      ),
    ];
  }

  FarmerProfile farmerProfile() {
    return FarmerProfile(
      soilType: 'Loamy',
      crops: const ['tomato', 'lettuce'],
      lat: 36.8,
      lng: 10.1,
      farmSizeHa: 2.5,
      habits: const {
        'wateringFrequency': 'daily',
        'fertilizerUsage': 'weekly',
        'careMode': 'mixed',
      },
      completedOnboarding: true,
    );
  }

  GamificationState gamificationState() {
    return GamificationState.fromJson({
      'xp': 140,
      'level': 'INTERMEDIATE',
      'lastDailyCheckIn': DateTime.now().toUtc().toIso8601String(),
      'tasksState': {
        'version': 1,
        'tasks': [
          {
            'id': 'water_today',
            'title': 'Water your plants today',
            'xpReward': 15,
            'completed': false,
          },
          {
            'id': 'check_system_health',
            'title': 'Check system health',
            'xpReward': 10,
            'completed': true,
          },
        ],
      },
    });
  }

  List<AlertItem> alerts() {
    final now = DateTime.now().toUtc();
    return [
      AlertItem(
        id: 'mock-alert-1',
        severity: 'MEDIUM',
        title: 'Moisture watch',
        message: 'Humidity dipped briefly — verify drip lines.',
        acknowledged: false,
        createdAt: now,
        deviceId: 'mock-device-1',
        deviceName: 'North Field Sensor',
      ),
    ];
  }
}
