import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/recommendation_data.dart';
import '../../data/models/telemetry_data.dart';
import '../../data/models/user_profile.dart';
import 'app_providers.dart';
import 'telemetry_provider.dart';
import 'user_profile_provider.dart';

final recommendationsNotifierProvider =
    AsyncNotifierProvider<RecommendationsNotifier, RecommendationData>(
      RecommendationsNotifier.new,
    );

class RecommendationsNotifier extends AsyncNotifier<RecommendationData> {
  @override
  Future<RecommendationData> build() async {
    return _load();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_load);
  }

  Future<RecommendationData> _load() async {
    final online = await ref.read(connectivityServiceProvider).isOnline();
    final UserProfile profile = await ref.read(
      userProfileNotifierProvider.future,
    );

    TelemetryData? telemetry;
    try {
      telemetry = await ref.read(telemetryNotifierProvider.future);
    } catch (_) {
      telemetry = null;
    }

    return ref
        .read(recommendationsRepositoryProvider)
        .fetchLatest(profile: profile, telemetry: telemetry, online: online);
  }
}
