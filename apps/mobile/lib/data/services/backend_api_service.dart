import 'package:dio/dio.dart';

import '../../core/app_config.dart';
import '../models/recommendation_data.dart';
import '../models/telemetry_data.dart';
import '../models/user_profile.dart';

class BackendApiService {
  BackendApiService({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.backendBaseUrl,
              connectTimeout: const Duration(seconds: 6),
              receiveTimeout: const Duration(seconds: 6),
            ),
          );

  final Dio _dio;

  Future<RecommendationData> fetchRecommendations({
    required UserProfile profile,
    required TelemetryData? latestTelemetry,
  }) async {
    final payload = <String, dynamic>{
      'soilType': profile.soilType,
      'cropType': profile.cropType,
      'location': {
        'latitude': profile.latitude,
        'longitude': profile.longitude,
      },
      'telemetry': latestTelemetry?.toJson(),
    };

    final response = await _dio.post<dynamic>(
      '/recommendations',
      data: payload,
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    return RecommendationData.fromJson(data);
  }
}
