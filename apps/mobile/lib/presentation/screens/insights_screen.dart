import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/recommendations_provider.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recommendationsAsync = ref.watch(recommendationsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Insights')),
      body: recommendationsAsync.when(
        data: (data) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: ListTile(
                title: const Text('Crop Health'),
                subtitle: Text(data.cropHealth),
              ),
            ),
            Card(
              child: ListTile(
                title: const Text('Irrigation Recommendation'),
                subtitle: Text(data.irrigation),
              ),
            ),
            Card(
              child: ListTile(
                title: const Text('Fertilizer Suggestion'),
                subtitle: Text(data.fertilizer),
              ),
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Best Crops to Plant',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    ...data.cropSuggestions.map(
                      (crop) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.eco_outlined),
                        title: Text(crop),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Failed to load insights: $error'),
          ),
        ),
      ),
    );
  }
}
