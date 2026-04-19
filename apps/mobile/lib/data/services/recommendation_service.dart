import 'package:dio/dio.dart';

import '../models/recommendation_item.dart';

/// REST wrapper for `/api/recommendations/*`.
class RecommendationService {
  RecommendationService(this._dio);

  final Dio _dio;

  Future<List<RecommendationItem>> list(String deviceId) async {
    final res = await _dio.get<List<dynamic>>('recommendations/$deviceId');
    final list = res.data ?? const [];
    return list
        .map(
          (e) => RecommendationItem.fromJson(
            Map<String, dynamic>.from(e as Map),
          ),
        )
        .toList();
  }

  Future<List<RecommendationItem>> generate(String deviceId) async {
    final res = await _dio.post<List<dynamic>>(
      'recommendations/generate',
      data: {'deviceId': deviceId},
    );
    final list = res.data ?? const [];
    return list
        .map(
          (e) => RecommendationItem.fromJson(
            Map<String, dynamic>.from(e as Map),
          ),
        )
        .toList();
  }
}
