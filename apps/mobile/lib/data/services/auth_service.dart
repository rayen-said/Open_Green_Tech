import 'package:dio/dio.dart';

import '../../core/config/env_config.dart';
import '../models/auth_user.dart';
import 'token_storage.dart';

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final AuthUser user;
}

class AuthService {
  AuthService({
    required Dio dio,
    required TokenStorage tokenStorage,
  })  : _dio = dio,
        _tokenStorage = tokenStorage;

  final Dio _dio;
  final TokenStorage _tokenStorage;

  Dio _publicAuthDio() {
    return Dio(
      BaseOptions(
        baseUrl: EnvConfig.instance.apiBaseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  Future<AuthSession> _sessionFromAuthResponse(Map<String, dynamic> data) async {
    final access = data['accessToken']?.toString() ?? '';
    final refresh = data['refreshToken']?.toString() ?? '';
    final userMap = data['user'] as Map<String, dynamic>? ?? {};
    final user = AuthUser.fromJson(userMap);
    await _tokenStorage.writeTokens(
      accessToken: access,
      refreshToken: refresh,
    );
    return AuthSession(
      accessToken: access,
      refreshToken: refresh,
      user: user,
    );
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final loginDio = _publicAuthDio();
    final res = await loginDio.post<Map<String, dynamic>>(
      'auth/login',
      data: {'email': email, 'password': password},
    );
    return _sessionFromAuthResponse(res.data ?? {});
  }

  Future<AuthSession> signup({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final loginDio = _publicAuthDio();
    final res = await loginDio.post<Map<String, dynamic>>(
      'auth/signup',
      data: {
        'fullName': fullName,
        'email': email,
        'password': password,
      },
    );
    return _sessionFromAuthResponse(res.data ?? {});
  }

  /// Exchanges a Supabase access JWT for Nest API tokens (`POST auth/supabase`).
  Future<AuthSession> loginWithSupabaseAccessToken(String supabaseAccessToken) async {
    final loginDio = _publicAuthDio();
    final res = await loginDio.post<Map<String, dynamic>>(
      'auth/supabase',
      data: {'accessToken': supabaseAccessToken},
    );
    return _sessionFromAuthResponse(res.data ?? {});
  }

  Future<AuthSession?> restoreSession() async {
    final access = await _tokenStorage.readAccessToken();
    final refresh = await _tokenStorage.readRefreshToken();
    if (access == null || refresh == null) {
      return null;
    }
    try {
      final user = await me();
      return AuthSession(
        accessToken: access,
        refreshToken: refresh,
        user: user,
      );
    } catch (_) {
      await _tokenStorage.clear();
      return null;
    }
  }

  Future<AuthUser> me() async {
    final res = await _dio.get<Map<String, dynamic>>('auth/me');
    return AuthUser.fromJson(res.data ?? {});
  }

  Future<void> logout() async {
    final refresh = await _tokenStorage.readRefreshToken();
    if (refresh != null) {
      try {
        final access = await _tokenStorage.readAccessToken();
        await _dio.post<void>(
          'auth/logout',
          data: {'refreshToken': refresh},
          options: access != null
              ? Options(headers: {'Authorization': 'Bearer $access'})
              : null,
        );
      } catch (_) {
        // Ignore network errors on logout.
      }
    }
    await _tokenStorage.clear();
  }
}
