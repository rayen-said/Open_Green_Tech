import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/farmer_profile.dart';
import '../providers/app_providers.dart';

/// Mobile-only onboarding questionnaire → `POST /api/user/profile`.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _cropsController = TextEditingController();
  final _farmSizeController = TextEditingController();

  String _soil = 'Loamy';
  String _watering = 'daily';
  String _fertilizer = 'weekly';
  String _careMode = 'mixed';
  double? _lat;
  double? _lng;
  bool _saving = false;

  static const _soils = [
    'Loamy',
    'Sandy',
    'Clay',
    'Silty',
    'Peaty',
    'Chalky',
  ];

  @override
  void dispose() {
    _cropsController.dispose();
    _farmSizeController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final crops = _cropsController.text
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .where((e) => e.isNotEmpty)
          .toList();
      final farmRaw = _farmSizeController.text.trim();
      final farmSize =
          farmRaw.isEmpty ? null : double.tryParse(farmRaw.replaceAll(',', '.'));

      final profile = FarmerProfile(
        soilType: _soil.toLowerCase(),
        crops: crops,
        lat: _lat,
        lng: _lng,
        farmSizeHa: farmSize,
        habits: {
          'wateringFrequency': _watering,
          'fertilizerUsage': _fertilizer,
          'careMode': _careMode,
        },
        completedOnboarding: true,
      );

      await ref.read(cropRepositoryProvider).saveFarmerProfile(profile);
      ref.invalidate(farmerProfileProvider);
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Welcome — tell us about your farm')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'This profile powers personalized AI recommendations on the server.',
            style: TextStyle(color: AppColors.textMuted),
          ),
          const SizedBox(height: 20),
          DropdownButtonFormField<String>(
            key: ValueKey(_soil),
            initialValue: _soil,
            decoration: const InputDecoration(labelText: 'Soil type'),
            items: _soils
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (v) {
              if (v != null) {
                setState(() => _soil = v);
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _cropsController,
            decoration: const InputDecoration(
              labelText: 'Crops planted (comma-separated)',
              hintText: 'tomato, lettuce',
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: ValueKey(_watering),
            initialValue: _watering,
            decoration: const InputDecoration(labelText: 'Watering frequency'),
            items: const [
              DropdownMenuItem(value: 'daily', child: Text('Daily')),
              DropdownMenuItem(
                value: 'every_other_day',
                child: Text('Every other day'),
              ),
              DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
            ],
            onChanged: (v) {
              if (v != null) {
                setState(() => _watering = v);
              }
            },
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: ValueKey(_fertilizer),
            initialValue: _fertilizer,
            decoration: const InputDecoration(labelText: 'Fertilizer usage'),
            items: const [
              DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
              DropdownMenuItem(value: 'biweekly', child: Text('Bi-weekly')),
              DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
              DropdownMenuItem(value: 'rarely', child: Text('Rarely')),
            ],
            onChanged: (v) {
              if (v != null) {
                setState(() => _fertilizer = v);
              }
            },
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: ValueKey(_careMode),
            initialValue: _careMode,
            decoration: const InputDecoration(labelText: 'Care style'),
            items: const [
              DropdownMenuItem(value: 'manual', child: Text('Mostly manual')),
              DropdownMenuItem(
                value: 'automated',
                child: Text('Mostly automated'),
              ),
              DropdownMenuItem(value: 'mixed', child: Text('Mixed')),
            ],
            onChanged: (v) {
              if (v != null) {
                setState(() => _careMode = v);
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _farmSizeController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Farm size (ha, optional)',
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('GPS location'),
            subtitle: Text(
              _lat != null && _lng != null
                  ? '${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)}'
                  : 'Optional — improves seasonal advice',
              style: TextStyle(color: AppColors.textMuted),
            ),
            trailing: FilledButton.tonal(
              onPressed: () async {
                final pos = await ref
                    .read(locationServiceProvider)
                    .getCurrentPositionOrNull();
                if (!mounted) {
                  return;
                }
                if (pos == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Location unavailable.')),
                  );
                  return;
                }
                setState(() {
                  _lat = pos.latitude;
                  _lng = pos.longitude;
                });
              },
              child: const Text('Use GPS'),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save & enter app'),
          ),
        ],
      ),
    );
  }
}
