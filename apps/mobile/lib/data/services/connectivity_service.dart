import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity;

  ConnectivityService({Connectivity? connectivity})
    : _connectivity = connectivity ?? Connectivity();

  bool _hasConnection(List<ConnectivityResult> results) {
    return !results.contains(ConnectivityResult.none);
  }

  Future<bool> isOnline() async {
    final results = await _connectivity.checkConnectivity();
    return _hasConnection(results);
  }

  Stream<bool> get statusStream async* {
    bool? last;
    await for (final results in _connectivity.onConnectivityChanged) {
      final now = _hasConnection(results);
      if (last != now) {
        last = now;
        yield now;
      }
    }
  }
}
