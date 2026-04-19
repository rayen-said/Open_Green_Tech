import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../core/config/env_config.dart';
import 'token_storage.dart';

class RealtimeService {
  RealtimeService({required TokenStorage tokenStorage})
      : _tokenStorage = tokenStorage;

  final TokenStorage _tokenStorage;
  io.Socket? _socket;

  Future<void> start({
    required void Function() onTelemetryUpdate,
    required void Function() onAlert,
  }) async {
    if (EnvConfig.instance.mockMode || _socket != null) {
      return;
    }

    final token = await _tokenStorage.readAccessToken();
    if (token == null || token.isEmpty) {
      return;
    }

    final socket = io.io(
      EnvConfig.instance.wsBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': 'Bearer $token'})
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );

    socket.on('telemetry:update', (_) => onTelemetryUpdate());
    socket.on('alerts:new', (_) => onAlert());
    socket.connect();
    _socket = socket;
  }

  Future<void> restart({
    required void Function() onTelemetryUpdate,
    required void Function() onAlert,
  }) async {
    await stop();
    await start(onTelemetryUpdate: onTelemetryUpdate, onAlert: onAlert);
  }

  Future<void> stop() async {
    _socket?.dispose();
    _socket = null;
  }
}
