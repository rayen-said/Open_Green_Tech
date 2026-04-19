class AppConfig {
  static const bool mockMode = bool.fromEnvironment(
    'MOCK_MODE',
    defaultValue: true,
  );

  static const String edgeBaseUrl = String.fromEnvironment(
    'EDGE_BASE_URL',
    defaultValue: 'http://192.168.4.1:8080',
  );

  static const String backendBaseUrl = String.fromEnvironment(
    'BACKEND_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}
