import 'package:dio/dio.dart';

import '../models/alert_item.dart';

/// REST wrapper for `/api/alerts`.
class AlertsService {
  AlertsService(this._dio);

  final Dio _dio;

  Future<List<AlertItem>> list() async {
    final res = await _dio.get<List<dynamic>>('alerts');
    final list = res.data ?? const [];
    return list
        .map(
          (e) => AlertItem.fromJson(Map<String, dynamic>.from(e as Map)),
        )
        .toList();
  }

  Future<void> acknowledge(String alertId) async {
    await _dio.patch<void>('alerts/$alertId/ack');
  }
}
