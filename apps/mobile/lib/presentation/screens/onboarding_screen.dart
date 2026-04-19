import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/farmer_profile.dart';
import '../providers/app_providers.dart';

/// Step-by-step farm profile → Hive + `POST /api/user/profile`.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  final _cropsController = TextEditingController();
  final _farmSizeController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();

  int _step = 0;
  String _soil = 'Loamy';
  String _watering = 'daily';
  String _fertilizer = 'weekly';
  String _careMode = 'mixed';
  bool _saving = false;

  static const _totalSteps = 4;

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
    _pageController.dispose();
    _cropsController.dispose();
    _farmSizeController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  double? _parseLat() {
    final t = _latController.text.trim();
    if (t.isEmpty) {
      return null;
    }
    return double.tryParse(t.replaceAll(',', '.'));
  }

  double? _parseLng() {
    final t = _lngController.text.trim();
    if (t.isEmpty) {
      return null;
    }
    return double.tryParse(t.replaceAll(',', '.'));
  }

  Future<void> _useGps() async {
    final pos = await ref.read(locationServiceProvider).getCurrentPositionOrNull();
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
      _latController.text = pos.latitude.toStringAsFixed(5);
      _lngController.text = pos.longitude.toStringAsFixed(5);
    });
  }

  Future<void> _submit() async {
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
        lat: _parseLat(),
        lng: _parseLng(),
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

  void _next() {
    if (_step < _totalSteps - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    } else {
      _submit();
    }
  }

  void _back() {
    if (_step > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_step + 1) / _totalSteps;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your farm profile'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(6),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                minHeight: 6,
                value: progress,
                color: AppColors.green500,
                backgroundColor: AppColors.bgSoft,
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Text(
              'Step ${_step + 1} of $_totalSteps — this powers personalized AI on the server.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (i) => setState(() => _step = i),
              children: [
                _stepSoil(),
                _stepCropsLocation(),
                _stepHabits(),
                _stepReview(),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Row(
              children: [
                if (_step > 0)
                  TextButton(onPressed: _saving ? null : _back, child: const Text('Back'))
                else
                  const SizedBox(width: 64),
                const Spacer(),
                FilledButton(
                  onPressed: _saving ? null : _next,
                  child: _saving
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(_step == _totalSteps - 1 ? 'Save & meet your buddy' : 'Next'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepSoil() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Soil type',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          key: ValueKey(_soil),
          initialValue: _soil,
          decoration: const InputDecoration(labelText: 'Primary soil'),
          items: _soils
              .map((s) => DropdownMenuItem(value: s, child: Text(s)))
              .toList(),
          onChanged: (v) {
            if (v != null) {
              setState(() => _soil = v);
            }
          },
        ),
      ],
    );
  }

  Widget _stepCropsLocation() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Crops & location',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _cropsController,
          decoration: const InputDecoration(
            labelText: 'Crops planted (comma-separated)',
            hintText: 'tomato, lettuce',
          ),
        ),
        const SizedBox(height: 16),
        Text('Coordinates', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _latController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                decoration: const InputDecoration(labelText: 'Latitude'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _lngController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                decoration: const InputDecoration(labelText: 'Longitude'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: FilledButton.tonal(onPressed: _useGps, child: const Text('Fill from GPS')),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _farmSizeController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Farm size (ha, optional)',
          ),
        ),
      ],
    );
  }

  Widget _stepHabits() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Growing habits',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          key: ValueKey(_watering),
          initialValue: _watering,
          decoration: const InputDecoration(labelText: 'Watering frequency'),
          items: const [
            DropdownMenuItem(value: 'daily', child: Text('Daily')),
            DropdownMenuItem(value: 'every_other_day', child: Text('Every other day')),
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
          decoration: const InputDecoration(labelText: 'Manual vs automated'),
          items: const [
            DropdownMenuItem(value: 'manual', child: Text('Mostly manual')),
            DropdownMenuItem(value: 'automated', child: Text('Mostly automated')),
            DropdownMenuItem(value: 'mixed', child: Text('Mixed')),
          ],
          onChanged: (v) {
            if (v != null) {
              setState(() => _careMode = v);
            }
          },
        ),
      ],
    );
  }

  Widget _stepReview() {
    final lat = _parseLat();
    final lng = _parseLng();
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Review',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        _ReviewLine('Soil', _soil),
        _ReviewLine('Crops', _cropsController.text.trim().isEmpty ? '—' : _cropsController.text),
        _ReviewLine(
          'Location',
          lat != null && lng != null ? '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}' : '—',
        ),
        _ReviewLine('Farm size (ha)', _farmSizeController.text.trim().isEmpty ? '—' : _farmSizeController.text),
        _ReviewLine('Watering', _watering),
        _ReviewLine('Fertilizer', _fertilizer),
        _ReviewLine('Care style', _careMode),
      ],
    );
  }
}

class _ReviewLine extends StatelessWidget {
  const _ReviewLine(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
