import 'dart:async';

import '../models/user_profile.dart';
import '../services/connectivity_service.dart';
import 'recommendations_repository.dart';
import 'telemetry_repository.dart';
import 'user_profile_repository.dart';

class SyncRepository {
  SyncRepository({
    required ConnectivityService connectivityService,
    required TelemetryRepository telemetryRepository,
    required RecommendationsRepository recommendationsRepository,
    required UserProfileRepository userProfileRepository,
  }) : _connectivityService = connectivityService,
       _telemetryRepository = telemetryRepository,
       _recommendationsRepository = recommendationsRepository,
       _userProfileRepository = userProfileRepository;

  final ConnectivityService _connectivityService;
  final TelemetryRepository _telemetryRepository;
  final RecommendationsRepository _recommendationsRepository;
  final UserProfileRepository _userProfileRepository;

  StreamSubscription<bool>? _subscription;

  void start() {
    _subscription ??= _connectivityService.statusStream.listen((online) async {
      if (!online) {
        return;
      }
      await syncNow();
    });
  }

  Future<void> syncNow() async {
    final UserProfile profile = await _userProfileRepository.loadProfile();
    final telemetry = await _telemetryRepository.fetchLatest(online: true);
    await _recommendationsRepository.fetchLatest(
      profile: profile,
      telemetry: telemetry,
      online: true,
    );
  }

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
