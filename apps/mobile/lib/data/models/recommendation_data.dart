import 'package:hive/hive.dart';

class RecommendationData {
  const RecommendationData({
    required this.cropHealth,
    required this.irrigation,
    required this.fertilizer,
    required this.cropSuggestions,
    required this.generatedAt,
  });

  final String cropHealth;
  final String irrigation;
  final String fertilizer;
  final List<String> cropSuggestions;
  final DateTime generatedAt;

  Map<String, dynamic> toJson() {
    return {
      'cropHealth': cropHealth,
      'irrigation': irrigation,
      'fertilizer': fertilizer,
      'cropSuggestions': cropSuggestions,
      'generatedAt': generatedAt.toIso8601String(),
    };
  }

  factory RecommendationData.fromJson(Map<String, dynamic> json) {
    return RecommendationData(
      cropHealth: json['cropHealth']?.toString() ?? 'Unknown',
      irrigation: json['irrigation']?.toString() ?? 'No recommendation.',
      fertilizer: json['fertilizer']?.toString() ?? 'No recommendation.',
      cropSuggestions: ((json['cropSuggestions'] as List?) ?? const [])
          .map((item) => item.toString())
          .toList(),
      generatedAt:
          DateTime.tryParse(json['generatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class RecommendationDataAdapter extends TypeAdapter<RecommendationData> {
  static const int typeIdValue = 2;

  @override
  final int typeId = typeIdValue;

  @override
  RecommendationData read(BinaryReader reader) {
    final cropHealth = reader.readString();
    final irrigation = reader.readString();
    final fertilizer = reader.readString();
    final cropSuggestions = (reader.readList()).cast<String>();
    final generatedAtMs = reader.readInt();

    return RecommendationData(
      cropHealth: cropHealth,
      irrigation: irrigation,
      fertilizer: fertilizer,
      cropSuggestions: cropSuggestions,
      generatedAt: DateTime.fromMillisecondsSinceEpoch(generatedAtMs),
    );
  }

  @override
  void write(BinaryWriter writer, RecommendationData obj) {
    writer
      ..writeString(obj.cropHealth)
      ..writeString(obj.irrigation)
      ..writeString(obj.fertilizer)
      ..writeList(obj.cropSuggestions)
      ..writeInt(obj.generatedAt.millisecondsSinceEpoch);
  }
}
