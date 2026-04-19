import '../notifications/local_notifications.dart';

/// Watering / fertilizer reminders using `flutter_local_notifications`.
class NotificationService {
  const NotificationService();

  Future<void> initialize() => LocalNotifications.setup();

  Future<bool> requestSystemPermission() => LocalNotifications.requestPermission();

  Future<void> scheduleCareReminders() => LocalNotifications.scheduleCropReminders();

  Future<void> cancelAll() => LocalNotifications.cancelAll();
}
