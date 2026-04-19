import 'package:hive/hive.dart';

class UserProfile {
  const UserProfile({
    required this.soilType,
    this.cropType,
    this.latitude,
    this.longitude,
    required this.updatedAt,
  });

  final String soilType;
  final String? cropType;
  final double? latitude;
  final double? longitude;
  final DateTime updatedAt;

  UserProfile copyWith({
    String? soilType,
    String? cropType,
    bool clearCropType = false,
    double? latitude,
    double? longitude,
  }) {
    return UserProfile(
      soilType: soilType ?? this.soilType,
      cropType: clearCropType ? null : (cropType ?? this.cropType),
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      updatedAt: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'soilType': soilType,
      'cropType': cropType,
      'latitude': latitude,
      'longitude': longitude,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      soilType: json['soilType']?.toString() ?? 'Loamy',
      cropType: json['cropType']?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      updatedAt:
          DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  factory UserProfile.defaultProfile() {
    return UserProfile(
      soilType: 'Loamy',
      cropType: null,
      latitude: null,
      longitude: null,
      updatedAt: DateTime.now(),
    );
  }
}

class UserProfileAdapter extends TypeAdapter<UserProfile> {
  static const int typeIdValue = 3;

  @override
  final int typeId = typeIdValue;

  @override
  UserProfile read(BinaryReader reader) {
    final soilType = reader.readString();
    final cropTypeRaw = reader.read();
    final latRaw = reader.read();
    final lonRaw = reader.read();
    final updatedAtMs = reader.readInt();

    return UserProfile(
      soilType: soilType,
      cropType: cropTypeRaw as String?,
      latitude: latRaw as double?,
      longitude: lonRaw as double?,
      updatedAt: DateTime.fromMillisecondsSinceEpoch(updatedAtMs),
    );
  }

  @override
  void write(BinaryWriter writer, UserProfile obj) {
    writer
      ..writeString(obj.soilType)
      ..write(obj.cropType)
      ..write(obj.latitude)
      ..write(obj.longitude)
      ..writeInt(obj.updatedAt.millisecondsSinceEpoch);
  }
}
