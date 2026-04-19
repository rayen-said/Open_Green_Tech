import 'package:dio/dio.dart';

import '../../core/app_config.dart';
import '../models/telemetry_data.dart';

class EdgeApiService {
  EdgeApiService({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.edgeBaseUrl,
              connectTimeout: const Duration(seconds: 4),
              receiveTimeout: const Duration(seconds: 4),
            ),
          );

  final Dio _dio;

  Future<TelemetryData> fetchTelemetry() async {
    final response = await _dio.get<dynamic>('/telemetry');
    final data = Map<String, dynamic>.from(response.data as Map);
    return TelemetryData.fromJson(data);
  }
}
