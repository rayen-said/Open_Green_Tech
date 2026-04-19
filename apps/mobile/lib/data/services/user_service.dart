import 'package:dio/dio.dart';

import '../models/auth_user.dart';
import '../models/device.dart';

/// User-facing profile operations aligned with NestJS:
/// - `GET /auth/me` for account
/// - Field agent “profile” (soil / location / crop) lives on `Device` — `PATCH /devices/:id`
class UserService {
  UserService(this._dio);

  final Dio _dio;

  Future<AuthUser> me() async {
    final res = await _dio.get<Map<String, dynamic>>('auth/me');
    return AuthUser.fromJson(res.data ?? {});
  }

  /// Persists soil, location text, and crop on the selected device record.
  Future<Device> updateDeviceProfile({
    required String deviceId,
    String? name,
    String? location,
    String? soilType,
    String? cropType,
    String? status,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) {
      body['name'] = name;
    }
    if (location != null) {
      body['location'] = location;
    }
    if (soilType != null) {
      body['soilType'] = soilType;
    }
    if (cropType != null) {
      body['cropType'] = cropType;
    }
    if (status != null) {
      body['status'] = status;
    }
    final res = await _dio.patch<Map<String, dynamic>>(
      'devices/$deviceId',
      data: body,
    );
    return Device.fromJson(res.data ?? {});
  }
}
