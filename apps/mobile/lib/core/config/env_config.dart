import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Runtime configuration loaded from `.env` (see `.env.example`).
/// Mirrors web `NEXT_PUBLIC_API_URL` style: base URL **including** `/api`.
class EnvConfig {
  EnvConfig._({
    required this.apiBaseUrl,
    required this.mockMode,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.openAiApiKey,
    required this.devLoginEmail,
    required this.devLoginPassword,
  });

  static EnvConfig? _instance;

  static EnvConfig get instance {
    final i = _instance;
    if (i == null) {
      throw StateError('EnvConfig.load() must be called before accessing instance');
    }
    return i;
  }

  static Future<void> load() async {
    try {
      await dotenv.load(fileName: '.env');
    } catch (_) {
      // `.env` may be absent on fresh clones; defaults still apply.
    }
    var base = dotenv.env['API_BASE_URL']?.trim();
    if (base == null || base.isEmpty) {
      base = dotenv.env['NEXT_PUBLIC_API_URL']?.trim();
    }
    if (base == null || base.isEmpty) {
      base = 'http://10.0.2.2:3000/api';
    }
    base = _normalizeApiBaseUrl(base);
    if (!base.endsWith('/')) {
      base = '$base/';
    }
    _instance = EnvConfig._(
      apiBaseUrl: base,
      mockMode: _parseBool(dotenv.env['MOCK_MODE'], fallback: false),
      supabaseUrl: dotenv.env['SUPABASE_URL']?.trim() ?? '',
      supabaseAnonKey: dotenv.env['SUPABASE_ANON_KEY']?.trim() ?? '',
      openAiApiKey: dotenv.env['OPENAI_API_KEY']?.trim() ?? '',
      devLoginEmail: dotenv.env['DEV_LOGIN_EMAIL']?.trim() ?? '',
      devLoginPassword: dotenv.env['DEV_LOGIN_PASSWORD']?.trim() ?? '',
    );
  }

  final String apiBaseUrl;
  final bool mockMode;
  final String supabaseUrl;
  final String supabaseAnonKey;
  final String openAiApiKey;
  final String devLoginEmail;
  final String devLoginPassword;

  bool get hasSupabaseCredentials =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Ensures the global Nest prefix `api` (see `apps/backend/src/main.ts`).
  static String _normalizeApiBaseUrl(String raw) {
    var b = raw.trim();
    while (b.endsWith('/')) {
      b = b.substring(0, b.length - 1);
    }
    if (b.endsWith('/api')) {
      return b;
    }
    return '$b/api';
  }

  static bool _parseBool(String? raw, {required bool fallback}) {
    if (raw == null) {
      return fallback;
    }
    final v = raw.toLowerCase();
    if (v == 'true' || v == '1' || v == 'yes') {
      return true;
    }
    if (v == 'false' || v == '0' || v == 'no') {
      return false;
    }
    return fallback;
  }
}
