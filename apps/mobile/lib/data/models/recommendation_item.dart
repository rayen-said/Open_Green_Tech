/// Matches `Recommendation` in `apps/web/src/lib/types.ts`.
class RecommendationItem {
  const RecommendationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.explanation,
    required this.reason,
    required this.detectedIssues,
    required this.confidence,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String explanation;
  final String reason;
  final List<String> detectedIssues;
  final int confidence;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'title': title,
        'explanation': explanation,
        'reason': reason,
        'detectedIssues': detectedIssues,
        'confidence': confidence,
        'createdAt': createdAt.toUtc().toIso8601String(),
      };

  factory RecommendationItem.fromJson(Map<String, dynamic> json) {
    final rawIssues = json['detectedIssues'];
    final List<String> issues;
    if (rawIssues is List) {
      issues = rawIssues.map((e) => e.toString()).toList();
    } else {
      issues = const [];
    }
    return RecommendationItem(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'CROP_HEALTH',
      title: json['title']?.toString() ?? '',
      explanation: json['explanation']?.toString() ?? '',
      reason: json['reason']?.toString() ?? '',
      detectedIssues: issues,
      confidence: (json['confidence'] as num?)?.round() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now().toUtc(),
    );
  }
}
