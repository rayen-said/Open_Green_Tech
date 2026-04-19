/// Matches `Alert` in `apps/web/src/lib/types.ts`.
class AlertItem {
  const AlertItem({
    required this.id,
    required this.severity,
    required this.title,
    required this.message,
    required this.acknowledged,
    required this.createdAt,
    this.deviceId,
    this.deviceName,
  });

  final String id;
  final String severity;
  final String title;
  final String message;
  final bool acknowledged;
  final DateTime createdAt;
  final String? deviceId;
  final String? deviceName;

  Map<String, dynamic> toJson() => {
        'id': id,
        'severity': severity,
        'title': title,
        'message': message,
        'acknowledged': acknowledged,
        'createdAt': createdAt.toUtc().toIso8601String(),
        'deviceId': deviceId,
        'deviceName': deviceName,
      };

  factory AlertItem.fromJson(Map<String, dynamic> json) {
    final device = json['device'] as Map<String, dynamic>?;
    return AlertItem(
      id: json['id']?.toString() ?? '',
      severity: json['severity']?.toString() ?? 'LOW',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      acknowledged: json['acknowledged'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now().toUtc(),
      deviceId: device?['id']?.toString(),
      deviceName: device?['name']?.toString(),
    );
  }
}
