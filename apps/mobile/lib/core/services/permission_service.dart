import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

/// Location + notification prompts aligned with the first-run permissions flow.
class PermissionService {
  const PermissionService();

  Future<bool> requestLocationWhenInUse() async {
    if (kIsWeb) {
      return true;
    }
    final ph = await Permission.locationWhenInUse.request();
    if (ph.isGranted || ph.isLimited) {
      return true;
    }
    final geo = await Geolocator.requestPermission();
    return geo == LocationPermission.always || geo == LocationPermission.whileInUse;
  }

  Future<bool> requestNotifications() async {
    if (kIsWeb) {
      return true;
    }
    final r = await Permission.notification.request();
    return r.isGranted || r.isLimited;
  }
}
