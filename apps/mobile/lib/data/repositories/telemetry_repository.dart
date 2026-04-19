import '../../core/app_config.dart';
import '../models/telemetry_data.dart';
import '../services/edge_api_service.dart';
import '../services/local_cache_service.dart';
import '../services/mock_data_service.dart';

class TelemetryRepository {
  TelemetryRepository({
    required EdgeApiService edgeApiService,
    required MockDataService mockDataService,
    required LocalCacheService localCacheService,
  }) : _edgeApiService = edgeApiService,
       _mockDataService = mockDataService,
       _localCacheService = localCacheService;

  final EdgeApiService _edgeApiService;
  final MockDataService _mockDataService;
  final LocalCacheService _localCacheService;

  Future<TelemetryData> fetchLatest({required bool online}) async {
    if (AppConfig.mockMode) {
      final mock = _mockDataService.generateTelemetry();
      await _localCacheService.saveTelemetry(mock);
      return mock;
    }

    if (online) {
      try {
        final telemetry = await _edgeApiService.fetchTelemetry();
        await _localCacheService.saveTelemetry(telemetry);
        return telemetry;
      } catch (_) {
        // Fall through to cache.
      }
    }

    final cached = _localCacheService.getLatestTelemetry();
    if (cached != null) {
      return cached;
    }

    final fallback = _mockDataService.generateTelemetry();
    await _localCacheService.saveTelemetry(fallback);
    return fallback;
  }

  Future<List<TelemetryData>> history({int limit = 20}) async {
    return _localCacheService.getTelemetryHistory(limit: limit);
  }
}
