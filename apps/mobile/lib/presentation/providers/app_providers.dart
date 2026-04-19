import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/recommendations_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../data/repositories/telemetry_repository.dart';
import '../../data/repositories/user_profile_repository.dart';
import '../../data/services/backend_api_service.dart';
import '../../data/services/connectivity_service.dart';
import '../../data/services/edge_api_service.dart';
import '../../data/services/local_cache_service.dart';
import '../../data/services/location_service.dart';
import '../../data/services/mock_data_service.dart';

final localCacheServiceProvider = Provider<LocalCacheService>(
  (ref) => LocalCacheService(),
);

final connectivityServiceProvider = Provider<ConnectivityService>(
  (ref) => ConnectivityService(),
);

final locationServiceProvider = Provider<LocationService>(
  (ref) => LocationService(),
);

final edgeApiServiceProvider = Provider<EdgeApiService>(
  (ref) => EdgeApiService(),
);

final backendApiServiceProvider = Provider<BackendApiService>(
  (ref) => BackendApiService(),
);

final mockDataServiceProvider = Provider<MockDataService>(
  (ref) => MockDataService(),
);

final telemetryRepositoryProvider = Provider<TelemetryRepository>(
  (ref) => TelemetryRepository(
    edgeApiService: ref.read(edgeApiServiceProvider),
    mockDataService: ref.read(mockDataServiceProvider),
    localCacheService: ref.read(localCacheServiceProvider),
  ),
);

final recommendationsRepositoryProvider = Provider<RecommendationsRepository>(
  (ref) => RecommendationsRepository(
    backendApiService: ref.read(backendApiServiceProvider),
    mockDataService: ref.read(mockDataServiceProvider),
    localCacheService: ref.read(localCacheServiceProvider),
  ),
);

final userProfileRepositoryProvider = Provider<UserProfileRepository>(
  (ref) => UserProfileRepository(
    localCacheService: ref.read(localCacheServiceProvider),
    locationService: ref.read(locationServiceProvider),
  ),
);

final connectivityStatusProvider = StreamProvider<bool>(
  (ref) => ref.read(connectivityServiceProvider).statusStream,
);

final syncRepositoryProvider = Provider<SyncRepository>(
  (ref) => SyncRepository(
    connectivityService: ref.read(connectivityServiceProvider),
    telemetryRepository: ref.read(telemetryRepositoryProvider),
    recommendationsRepository: ref.read(recommendationsRepositoryProvider),
    userProfileRepository: ref.read(userProfileRepositoryProvider),
  ),
);

final syncBootstrapProvider = Provider<void>((ref) {
  final syncRepository = ref.read(syncRepositoryProvider);
  syncRepository.start();
  ref.onDispose(syncRepository.dispose);
});
