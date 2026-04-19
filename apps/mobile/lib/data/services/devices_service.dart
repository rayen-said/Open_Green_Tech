import 'package:dio/dio.dart';

import '../models/device.dart';

class DevicesService {
  DevicesService(this._dio);

  final Dio _dio;

  Future<List<Device>> list() async {
    final res = await _dio.get<List<dynamic>>('devices');
    final list = res.data ?? const [];
    return list
        .map((e) => Device.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
