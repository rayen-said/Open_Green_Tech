import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/user_profile.dart';
import 'app_providers.dart';

final userProfileNotifierProvider =
    AsyncNotifierProvider<UserProfileNotifier, UserProfile>(
      UserProfileNotifier.new,
    );

class UserProfileNotifier extends AsyncNotifier<UserProfile> {
  @override
  Future<UserProfile> build() async {
    return ref.read(userProfileRepositoryProvider).loadProfile();
  }

  Future<void> refreshLocation() async {
    final current = await future;
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(userProfileRepositoryProvider).updateLocation(current),
    );
  }

  Future<void> updateSoilType(String soilType) async {
    final current = await future;
    final updated = current.copyWith(soilType: soilType);
    state = AsyncData(
      await ref.read(userProfileRepositoryProvider).saveProfile(updated),
    );
  }

  Future<void> updateCropType(String? cropType) async {
    final current = await future;
    final updated = cropType == null || cropType.trim().isEmpty
        ? current.copyWith(clearCropType: true)
        : current.copyWith(cropType: cropType.trim());

    state = AsyncData(
      await ref.read(userProfileRepositoryProvider).saveProfile(updated),
    );
  }
}
