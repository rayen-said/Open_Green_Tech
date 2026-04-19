import '../models/user_profile.dart';
import '../services/local_cache_service.dart';
import '../services/location_service.dart';

class UserProfileRepository {
  UserProfileRepository({
    required LocalCacheService localCacheService,
    required LocationService locationService,
  }) : _localCacheService = localCacheService,
       _locationService = locationService;

  final LocalCacheService _localCacheService;
  final LocationService _locationService;

  Future<UserProfile> loadProfile() async {
    final cached = _localCacheService.getUserProfile();
    if (cached != null) {
      return cached;
    }

    final defaultProfile = UserProfile.defaultProfile();
    await _localCacheService.saveUserProfile(defaultProfile);
    return defaultProfile;
  }

  Future<UserProfile> saveProfile(UserProfile profile) async {
    await _localCacheService.saveUserProfile(profile);
    return profile;
  }

  Future<UserProfile> updateLocation(UserProfile profile) async {
    final position = await _locationService.getCurrentPositionOrNull();
    if (position == null) {
      return profile;
    }

    final updated = profile.copyWith(
      latitude: position.latitude,
      longitude: position.longitude,
    );
    await _localCacheService.saveUserProfile(updated);
    return updated;
  }
}
