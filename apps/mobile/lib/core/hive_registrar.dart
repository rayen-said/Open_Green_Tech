import 'package:hive/hive.dart';

import '../data/models/recommendation_data.dart';
import '../data/models/telemetry_data.dart';
import '../data/models/user_profile.dart';

void registerHiveAdapters() {
  if (!Hive.isAdapterRegistered(TelemetryDataAdapter.typeIdValue)) {
    Hive.registerAdapter(TelemetryDataAdapter());
  }
  if (!Hive.isAdapterRegistered(RecommendationDataAdapter.typeIdValue)) {
    Hive.registerAdapter(RecommendationDataAdapter());
  }
  if (!Hive.isAdapterRegistered(UserProfileAdapter.typeIdValue)) {
    Hive.registerAdapter(UserProfileAdapter());
  }
}
