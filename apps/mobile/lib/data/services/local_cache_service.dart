import 'package:hive/hive.dart';

import '../models/recommendation_data.dart';
import '../models/telemetry_data.dart';
import '../models/user_profile.dart';

class LocalCacheService {
  static const String telemetryBoxName = 'telemetry_box';
  static const String recommendationBoxName = 'recommendation_box';
  static const String userProfileBoxName = 'user_profile_box';

  Future<void> init() async {
    await Hive.openBox<TelemetryData>(telemetryBoxName);
    await Hive.openBox<RecommendationData>(recommendationBoxName);
    await Hive.openBox<UserProfile>(userProfileBoxName);
  }

  Future<void> saveTelemetry(TelemetryData telemetry) async {
    final box = Hive.box<TelemetryData>(telemetryBoxName);
    await box.put('latest', telemetry);
    await box.add(telemetry);
  }

  TelemetryData? getLatestTelemetry() {
    final box = Hive.box<TelemetryData>(telemetryBoxName);
    return box.get('latest');
  }

  List<TelemetryData> getTelemetryHistory({int limit = 20}) {
    final box = Hive.box<TelemetryData>(telemetryBoxName);
    final values = box.values.toList();
    values.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return values.take(limit).toList();
  }

  Future<void> saveRecommendation(RecommendationData recommendation) async {
    final box = Hive.box<RecommendationData>(recommendationBoxName);
    await box.put('latest', recommendation);
  }

  RecommendationData? getLatestRecommendation() {
    final box = Hive.box<RecommendationData>(recommendationBoxName);
    return box.get('latest');
  }

  Future<void> saveUserProfile(UserProfile profile) async {
    final box = Hive.box<UserProfile>(userProfileBoxName);
    await box.put('profile', profile);
  }

  UserProfile? getUserProfile() {
    final box = Hive.box<UserProfile>(userProfileBoxName);
    return box.get('profile');
  }
}
