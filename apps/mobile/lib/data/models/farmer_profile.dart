/// Mirrors `GET/POST /api/user/profile` contract.
class FarmerProfile {
  const FarmerProfile({
    required this.soilType,
    required this.crops,
    required this.lat,
    required this.lng,
    required this.farmSizeHa,
    required this.habits,
    required this.completedOnboarding,
  });

  final String? soilType;
  final List<String> crops;
  final double? lat;
  final double? lng;
  final double? farmSizeHa;
  final Map<String, dynamic> habits;
  final bool completedOnboarding;

  factory FarmerProfile.initial() => FarmerProfile(
        soilType: null,
        crops: const [],
        lat: null,
        lng: null,
        farmSizeHa: null,
        habits: const {},
        completedOnboarding: false,
      );

  Map<String, dynamic> toUpsertBody() {
    final body = <String, dynamic>{
      'crops': crops,
      'habits': habits,
      'completedOnboarding': completedOnboarding,
    };
    if (soilType != null && soilType!.isNotEmpty) {
      body['soilType'] = soilType;
    }
    if (lat != null && lng != null) {
      body['location'] = {'lat': lat, 'lng': lng};
    }
    if (farmSizeHa != null) {
      body['farmSizeHa'] = farmSizeHa;
    }
    return body;
  }

  factory FarmerProfile.fromJson(Map<String, dynamic> json) {
    final loc = json['location'];
    double? lat;
    double? lng;
    if (loc is Map) {
      final m = Map<String, dynamic>.from(loc);
      lat = (m['lat'] as num?)?.toDouble();
      lng = (m['lng'] as num?)?.toDouble();
    }
    final cropsRaw = json['crops'];
    final crops = cropsRaw is List
        ? cropsRaw.map((e) => e.toString()).toList()
        : <String>[];
    final habitsRaw = json['habits'];
    final habits = habitsRaw is Map<String, dynamic>
        ? Map<String, dynamic>.from(habitsRaw)
        : <String, dynamic>{};
    return FarmerProfile(
      soilType: json['soilType']?.toString(),
      crops: crops,
      lat: lat,
      lng: lng,
      farmSizeHa: (json['farmSizeHa'] as num?)?.toDouble(),
      habits: habits,
      completedOnboarding: json['completedOnboarding'] == true,
    );
  }
}
