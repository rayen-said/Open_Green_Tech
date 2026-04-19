import 'package:dio/dio.dart';

import '../../core/config/env_config.dart';
import '../services/token_storage.dart';

/// Shared Dio client with bearer injection + one-shot refresh on 401.
Dio createAuthorizedDio(TokenStorage tokenStorage) {
  final dio = Dio(
    BaseOptions(
      baseUrl: EnvConfig.instance.apiBaseUrl,
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final access = await tokenStorage.readAccessToken();
        if (access != null && access.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $access';
        }
        handler.next(options);
      },
      onError: (err, handler) async {
        final response = err.response;
        if (response?.statusCode != 401) {
          handler.next(err);
          return;
        }
        final requestOptions = err.requestOptions;
        if (requestOptions.extra['retried'] == true) {
          handler.next(err);
          return;
        }
        final refresh = await tokenStorage.readRefreshToken();
        if (refresh == null || refresh.isEmpty) {
          handler.next(err);
          return;
        }
        try {
          final refreshDio = Dio(
            BaseOptions(
              baseUrl: EnvConfig.instance.apiBaseUrl,
              connectTimeout: const Duration(seconds: 12),
              receiveTimeout: const Duration(seconds: 20),
              headers: {'Content-Type': 'application/json'},
            ),
          );
          final res = await refreshDio.post<Map<String, dynamic>>(
            'auth/refresh',
            data: {'refreshToken': refresh},
          );
          final data = res.data ?? {};
          final accessToken = data['accessToken']?.toString() ?? '';
          final refreshToken = data['refreshToken']?.toString() ?? '';
          if (accessToken.isEmpty || refreshToken.isEmpty) {
            handler.next(err);
            return;
          }
          await tokenStorage.writeTokens(
            accessToken: accessToken,
            refreshToken: refreshToken,
          );
          requestOptions.headers['Authorization'] = 'Bearer $accessToken';
          requestOptions.extra['retried'] = true;
          final clone = await dio.fetch<dynamic>(requestOptions);
          handler.resolve(clone);
        } catch (_) {
          handler.next(err);
        }
      },
    ),
  );

  return dio;
}
