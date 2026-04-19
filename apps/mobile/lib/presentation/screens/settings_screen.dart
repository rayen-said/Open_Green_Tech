import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/env_config.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/device.dart';
import '../providers/app_providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _cropController = TextEditingController();
  String? _loadedCropForDeviceId;

  static const _soilTypes = [
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
    final devicesAsync = ref.watch(devicesProvider);
    final selectedId = ref.watch(selectedDeviceIdProvider);
    final auth = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(authNotifierProvider.notifier).logout();
            },
            child: const Text('Log out'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          auth.maybeWhen(
            data: (session) {
              final u = session?.user;
              if (u == null) {
                return const SizedBox.shrink();
              }
              return Card(
                child: ListTile(
                  title: Text(u.fullName),
                  subtitle: Text('${u.email} · ${u.role}'),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
          const SizedBox(height: 12),
          if (EnvConfig.instance.supabaseUrl.isNotEmpty)
            Card(
              child: ListTile(
                title: const Text('Supabase'),
                subtitle: Text(EnvConfig.instance.supabaseUrl),
              ),
            ),
          const SizedBox(height: 12),
          devicesAsync.when(
            data: (devices) {
              Device? device;
              for (final d in devices) {
                if (d.id == selectedId) {
                  device = d;
                  break;
                }
              }
              if (device == null) {
                return Card(
                  child: ListTile(
                    title: const Text('Field profile'),
                    subtitle: Text(
                      'Select a device from the dashboard picker first.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                );
              }
              final fieldDevice = device;
              if (_loadedCropForDeviceId != fieldDevice.id) {
                _cropController.text = fieldDevice.cropType;
                _loadedCropForDeviceId = fieldDevice.id;
              }

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Field profile (${fieldDevice.name})',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        key: ValueKey(
                          '${fieldDevice.id}-${fieldDevice.soilType}',
                        ),
                        initialValue: _soilTypes.contains(fieldDevice.soilType)
                            ? fieldDevice.soilType
                            : _soilTypes.first,
                        decoration: const InputDecoration(labelText: 'Soil type'),
                        items: _soilTypes
                            .map(
                              (s) => DropdownMenuItem(value: s, child: Text(s)),
                            )
                            .toList(),
                        onChanged: (v) {
                          if (v == null) {
                            return;
                          }
                          _patch(context, fieldDevice, soilType: v);
                        },
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _cropController,
                        decoration: const InputDecoration(
                          labelText: 'Crop type',
                        ),
                      ),
                      const SizedBox(height: 12),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Location'),
                        subtitle: Text(
                          fieldDevice.location.isEmpty
                              ? 'Not set'
                              : fieldDevice.location,
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                        trailing: FilledButton.tonal(
                          onPressed: () async {
                            final pos = await ref
                                .read(locationServiceProvider)
                                .getCurrentPositionOrNull();
                            if (!context.mounted) {
                              return;
                            }
                            if (pos == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Location permission denied.'),
                                ),
                              );
                              return;
                            }
                            final loc =
                                '${pos.latitude.toStringAsFixed(5)}, ${pos.longitude.toStringAsFixed(5)}';
                            await _patch(context, fieldDevice, location: loc);
                          },
                          child: const Text('GPS'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: () async {
                          await _patch(
                            context,
                            fieldDevice,
                            cropType: _cropController.text.trim(),
                          );
                        },
                        child: const Text('Save to device'),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Updates PATCH /devices/:id on the NestJS API (same fields as the web device form).',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('$e'),
          ),
        ],
      ),
    );
  }

  Future<void> _patch(
    BuildContext context,
    Device device, {
    String? soilType,
    String? location,
    String? cropType,
  }) async {
    try {
      await ref.read(cropRepositoryProvider).patchDevice(
            deviceId: device.id,
            soilType: soilType,
            location: location,
            cropType: cropType,
          );
      ref.invalidate(devicesProvider);
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Saved')),
      );
    } catch (e) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Save failed: $e')),
      );
    }
  }
}
