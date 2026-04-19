/// Mirrors `GET/POST /api/user/gamification`.
class GamificationState {
  const GamificationState({
    required this.xp,
    required this.level,
    required this.lastDailyCheckIn,
    required this.tasksState,
  });

  final int xp;
  final String level;
  final DateTime? lastDailyCheckIn;
  final Map<String, dynamic> tasksState;

  factory GamificationState.fromJson(Map<String, dynamic> json) {
    final rawTasks = json['tasksState'];
    final tasksState = rawTasks is Map<String, dynamic>
        ? Map<String, dynamic>.from(rawTasks)
        : <String, dynamic>{};
    return GamificationState(
      xp: (json['xp'] as num?)?.round() ?? 0,
      level: json['level']?.toString() ?? 'BEGINNER',
      lastDailyCheckIn: json['lastDailyCheckIn'] != null
          ? DateTime.tryParse(json['lastDailyCheckIn'].toString())
          : null,
      tasksState: tasksState,
    );
  }

  Map<String, dynamic> toJson() => {
        'xp': xp,
        'level': level,
        'lastDailyCheckIn': lastDailyCheckIn?.toUtc().toIso8601String(),
        'tasksState': tasksState,
      };
}
