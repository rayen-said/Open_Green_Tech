import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/user_profile_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final TextEditingController _cropController = TextEditingController();

  static const List<String> _soilTypes = [
    'Loamy',
    'Sandy',
    'Clay',
    'Silty',
    'Peaty',
    'Chalky',
  ];

  @override
  void dispose() {
    _cropController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: profileAsync.when(
        data: (profile) {
          _cropController.text = profile.cropType ?? '';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              DropdownButtonFormField<String>(
                initialValue: profile.soilType,
                decoration: const InputDecoration(
                  labelText: 'Soil Type',
                  border: OutlineInputBorder(),
                ),
                items: _soilTypes
                    .map(
                      (soil) =>
                          DropdownMenuItem(value: soil, child: Text(soil)),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    ref
                        .read(userProfileNotifierProvider.notifier)
                        .updateSoilType(value);
                  }
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _cropController,
                decoration: const InputDecoration(
                  labelText: 'Crop Type (optional)',
                  border: OutlineInputBorder(),
                ),
                onSubmitted: (value) {
                  ref
                      .read(userProfileNotifierProvider.notifier)
                      .updateCropType(value);
                },
              ),
              const SizedBox(height: 16),
              Card(
                child: ListTile(
                  title: const Text('Location'),
                  subtitle: Text(
                    profile.latitude == null || profile.longitude == null
                        ? 'Not set'
                        : '${profile.latitude!.toStringAsFixed(5)}, ${profile.longitude!.toStringAsFixed(5)}',
                  ),
                  trailing: FilledButton.tonal(
                    onPressed: () async {
                      await ref
                          .read(userProfileNotifierProvider.notifier)
                          .refreshLocation();
                    },
                    child: const Text('Use GPS'),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () {
                  ref
                      .read(userProfileNotifierProvider.notifier)
                      .updateCropType(_cropController.text);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile saved locally.')),
                  );
                },
                child: const Text('Save'),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Failed to load settings: $error'),
          ),
        ),
      ),
    );
  }
}
