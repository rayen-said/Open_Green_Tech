import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/env_config.dart';
import '../../data/models/alert_item.dart';
import '../../data/models/anomaly_summary.dart';
import '../../data/models/auth_user.dart';
import '../../data/models/device.dart';
import '../../data/models/farmer_profile.dart';
import '../../data/models/gamification_state.dart';
import '../../data/models/recommendation_item.dart';
import '../../data/models/telemetry_point.dart';
import '../../data/network/authorized_dio.dart';
import '../../data/offline/offline_store.dart';
import '../../data/repositories/crop_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../data/services/alerts_service.dart';
import '../../data/services/anomaly_service.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/connectivity_service.dart';
import '../../data/services/devices_service.dart';
import '../../data/services/location_service.dart';
import '../../data/services/mock_data_service.dart';
import '../../data/services/recommendation_service.dart';
import '../../data/services/telemetry_service.dart';
import '../../data/services/token_storage.dart';
import '../../data/services/user_portal_service.dart';
import '../../data/services/user_service.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final authorizedDioProvider = Provider<Dio>((ref) {
  return createAuthorizedDio(ref.watch(tokenStorageProvider));
});

final telemetryServiceProvider = Provider<TelemetryService>(
  (ref) => TelemetryService(ref.watch(authorizedDioProvider)),
);

final recommendationServiceProvider = Provider<RecommendationService>(
  (ref) => RecommendationService(ref.watch(authorizedDioProvider)),
);

final alertsServiceProvider = Provider<AlertsService>(
  (ref) => AlertsService(ref.watch(authorizedDioProvider)),
);

final devicesServiceProvider = Provider<DevicesService>(
  (ref) => DevicesService(ref.watch(authorizedDioProvider)),
);

final userServiceProvider = Provider<UserService>(
  (ref) => UserService(ref.watch(authorizedDioProvider)),
);

final userPortalServiceProvider = Provider<UserPortalService>(
  (ref) => UserPortalService(ref.watch(authorizedDioProvider)),
);

final mockDataServiceProvider = Provider<MockDataService>(
  (ref) => MockDataService(),
);

final connectivityServiceProvider = Provider<ConnectivityService>(
  (ref) => ConnectivityService(),
);

final locationServiceProvider = Provider<LocationService>(
  (ref) => LocationService(),
);

final cropRepositoryProvider = Provider<CropRepository>((ref) {
  return CropRepository(
    telemetryService: ref.watch(telemetryServiceProvider),
    recommendationService: ref.watch(recommendationServiceProvider),
    alertsService: ref.watch(alertsServiceProvider),
    devicesService: ref.watch(devicesServiceProvider),
    userService: ref.watch(userServiceProvider),
    userPortalService: ref.watch(userPortalServiceProvider),
    connectivity: ref.watch(connectivityServiceProvider),
    mockDataService: ref.watch(mockDataServiceProvider),
    offline: OfflineStore.instance,
  );
});

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(
    dio: ref.watch(authorizedDioProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

final selectedDeviceIdProvider =
    NotifierProvider<SelectedDeviceIdNotifier, String?>(
      SelectedDeviceIdNotifier.new,
    );

class SelectedDeviceIdNotifier extends Notifier<String?> {
  @override
  String? build() => OfflineStore.instance.readSelectedDeviceId();

  Future<void> set(String? id) async {
    await OfflineStore.instance.saveSelectedDeviceId(id);
    state = id;
  }
}

final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, AuthSession?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() async {
    if (EnvConfig.instance.mockMode) {
      return AuthSession(
        accessToken: '',
        refreshToken: '',
        user: ref.read(mockDataServiceProvider).demoUser(),
      );
    }
    return ref.read(authServiceProvider).restoreSession();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await ref.read(authServiceProvider).login(
            email: email,
            password: password,
          );
      await OfflineStore.instance.saveUser(session.user);
      _invalidateData();
      return session;
    });
  }

  Future<void> logout() async {
    if (EnvConfig.instance.mockMode) {
      await OfflineStore.instance.clearSessionCaches();
      await ref.read(selectedDeviceIdProvider.notifier).set(null);
      _invalidateData();
      state = AsyncData(
        AuthSession(
          accessToken: '',
          refreshToken: '',
          user: ref.read(mockDataServiceProvider).demoUser(),
        ),
      );
      return;
    }
    await ref.read(authServiceProvider).logout();
    await OfflineStore.instance.clearSessionCaches();
    await ref.read(selectedDeviceIdProvider.notifier).set(null);
    _invalidateData();
    state = const AsyncData(null);
  }

  void _invalidateData() {
    ref.invalidate(devicesProvider);
    ref.invalidate(telemetrySeriesProvider);
    ref.invalidate(recommendationsProvider);
    ref.invalidate(alertsProvider);
    ref.invalidate(farmerProfileProvider);
    ref.invalidate(gamificationProvider);
  }
}

final devicesProvider = FutureProvider.autoDispose<List<Device>>((ref) async {
  return ref.read(cropRepositoryProvider).loadDevices();
});

final telemetrySeriesProvider =
    FutureProvider.autoDispose<List<TelemetryPoint>>((ref) async {
  final id = ref.watch(selectedDeviceIdProvider);
  if (id == null || id.isEmpty) {
    return const [];
  }
  return ref.read(cropRepositoryProvider).loadTelemetrySeries(id);
});

final recommendationsProvider =
    FutureProvider.autoDispose<List<RecommendationItem>>((ref) async {
  final id = ref.watch(selectedDeviceIdProvider);
  if (id == null || id.isEmpty) {
    return const [];
  }
  return ref.read(cropRepositoryProvider).loadRecommendations(id);
});

final alertsProvider = FutureProvider.autoDispose<List<AlertItem>>((ref) async {
  return ref.read(cropRepositoryProvider).loadAlerts();
});

final anomalyServiceProvider = Provider<AnomalyService>(
  (ref) => AnomalyService(),
);

final anomalySummaryProvider = Provider.autoDispose<AnomalySummary>((ref) {
  final pts = ref.watch(telemetrySeriesProvider).value ?? const [];
  return ref.read(anomalyServiceProvider).summarizeSeries(pts);
});

final connectivityStatusProvider = StreamProvider<bool>(
  (ref) => ref.watch(connectivityServiceProvider).statusStream,
);

final userProfileProvider = FutureProvider.autoDispose<AuthUser>((ref) async {
  if (EnvConfig.instance.mockMode) {
    return ref.read(mockDataServiceProvider).demoUser();
  }
  return ref.read(cropRepositoryProvider).loadUser();
});

final farmerProfileProvider =
    FutureProvider.autoDispose<FarmerProfile>((ref) async {
  return ref.read(cropRepositoryProvider).loadFarmerProfile();
});

final gamificationProvider =
    FutureProvider.autoDispose<GamificationState>((ref) async {
  return ref.read(cropRepositoryProvider).loadGamification();
});

final syncRepositoryProvider = Provider<SyncRepository>((ref) {
  return SyncRepository(
    connectivity: ref.watch(connectivityServiceProvider),
    repository: ref.watch(cropRepositoryProvider),
    onSynced: () {
      ref.invalidate(devicesProvider);
      ref.invalidate(telemetrySeriesProvider);
      ref.invalidate(recommendationsProvider);
      ref.invalidate(alertsProvider);
      ref.invalidate(userProfileProvider);
      ref.invalidate(farmerProfileProvider);
      ref.invalidate(gamificationProvider);
    },
    selectedDeviceId: () => ref.read(selectedDeviceIdProvider),
  );
});

final syncBootstrapProvider = Provider<void>((ref) {
  final sync = ref.read(syncRepositoryProvider);
  sync.start();
  ref.onDispose(sync.dispose);
});
