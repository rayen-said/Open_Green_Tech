import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/env_config.dart';
import 'core/notifications/local_notifications.dart';
import 'data/offline/offline_store.dart';
import 'presentation/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EnvConfig.load();
  if (EnvConfig.instance.hasSupabaseCredentials) {
    await Supabase.initialize(
      url: EnvConfig.instance.supabaseUrl,
      anonKey: EnvConfig.instance.supabaseAnonKey,
    );
  }
  await Hive.initFlutter();
  await OfflineStore.instance.init();
  await LocalNotifications.setup();

  runApp(const ProviderScope(child: CropAdvisorApp()));
}
