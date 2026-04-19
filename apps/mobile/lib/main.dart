import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/config/env_config.dart';
import 'data/offline/offline_store.dart';
import 'presentation/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EnvConfig.load();
  await Hive.initFlutter();
  await OfflineStore.instance.init();

  runApp(const ProviderScope(child: CropAdvisorApp()));
}
