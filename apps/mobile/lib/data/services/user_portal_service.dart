import 'package:dio/dio.dart';

/// `/api/user/profile` and `/api/user/gamification`.
class UserPortalService {
  UserPortalService(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> getProfile() async {
    final res = await _dio.get<Map<String, dynamic>>('user/profile');
    return Map<String, dynamic>.from(res.data ?? {});
  }

  Future<Map<String, dynamic>> upsertProfile(Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>('user/profile', data: body);
    return Map<String, dynamic>.from(res.data ?? {});
  }

  Future<Map<String, dynamic>> getGamification() async {
    final res = await _dio.get<Map<String, dynamic>>('user/gamification');
    return Map<String, dynamic>.from(res.data ?? {});
  }

  Future<Map<String, dynamic>> syncGamification(Map<String, dynamic> body) async {
    final res =
        await _dio.post<Map<String, dynamic>>('user/gamification', data: body);
    return Map<String, dynamic>.from(res.data ?? {});
  }
}
