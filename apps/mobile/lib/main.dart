import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/hive_registrar.dart';
import 'data/services/local_cache_service.dart';
import 'presentation/app.dart';
import 'presentation/providers/app_providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  registerHiveAdapters();

  final localCache = LocalCacheService();
  await localCache.init();

  runApp(
    ProviderScope(
      overrides: [localCacheServiceProvider.overrideWithValue(localCache)],
      child: const CropAdvisorApp(),
    ),
  );
}
