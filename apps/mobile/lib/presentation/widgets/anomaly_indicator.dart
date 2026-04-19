import 'package:flutter/material.dart';

class AnomalyIndicator extends StatelessWidget {
  const AnomalyIndicator({super.key, required this.score});

  final double score;

  Color _scoreColor() {
    if (score > 0.75) {
      return Colors.red;
    }
    if (score > 0.5) {
      return Colors.orange;
    }
    return Colors.green;
  }

  String _label() {
    if (score > 0.75) {
      return 'High';
    }
    if (score > 0.5) {
      return 'Medium';
    }
    return 'Low';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Anomaly Score',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                minHeight: 12,
                value: score.clamp(0.0, 1.0).toDouble(),
                color: _scoreColor(),
                backgroundColor: Colors.grey.shade200,
              ),
            ),
            const SizedBox(height: 8),
            Text('${(score * 100).toStringAsFixed(1)}% ($_label())'),
          ],
        ),
      ),
    );
  }
}
