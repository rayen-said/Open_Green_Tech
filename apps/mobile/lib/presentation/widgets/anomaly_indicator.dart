import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

/// Visualizes boolean anomaly flag as a 0–100% bar (matches web “risk / healthy”).
class AnomalyIndicator extends StatelessWidget {
  const AnomalyIndicator({super.key, required this.anomaly});

  final bool anomaly;

  @override
  Widget build(BuildContext context) {
    final score = anomaly ? 1.0 : 0.0;
    final color = anomaly ? AppColors.danger : AppColors.green500;
    final label = anomaly ? 'Elevated risk window' : 'Stable readings';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Anomaly indicator',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                minHeight: 12,
                value: score,
                color: color,
                backgroundColor: AppColors.bgSoft,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${(score * 100).toStringAsFixed(0)}% · $label',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textMuted,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
