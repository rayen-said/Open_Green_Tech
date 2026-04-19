import '../../core/app_config.dart';
import '../models/recommendation_data.dart';
import '../models/telemetry_data.dart';
import '../models/user_profile.dart';
import '../services/backend_api_service.dart';
import '../services/local_cache_service.dart';
import '../services/mock_data_service.dart';

class RecommendationsRepository {
  RecommendationsRepository({
    required BackendApiService backendApiService,
    required MockDataService mockDataService,
    required LocalCacheService localCacheService,
  }) : _backendApiService = backendApiService,
       _mockDataService = mockDataService,
       _localCacheService = localCacheService;

  final BackendApiService _backendApiService;
  final MockDataService _mockDataService;
  final LocalCacheService _localCacheService;

  Future<RecommendationData> fetchLatest({
    required UserProfile profile,
    required TelemetryData? telemetry,
    required bool online,
  }) async {
    if (AppConfig.mockMode) {
      final mock = _mockDataService.generateRecommendations(profile);
      await _localCacheService.saveRecommendation(mock);
      return mock;
    }

    if (online) {
      try {
        final recommendation = await _backendApiService.fetchRecommendations(
          profile: profile,
          latestTelemetry: telemetry,
        );
        await _localCacheService.saveRecommendation(recommendation);
        return recommendation;
      } catch (_) {
        // Fall through to cache.
      }
    }

    final cached = _localCacheService.getLatestRecommendation();
    if (cached != null) {
      return cached;
    }

    final fallback = _mockDataService.generateRecommendations(profile);
    await _localCacheService.saveRecommendation(fallback);
    return fallback;
  }
}
