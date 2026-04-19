import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/notification_service.dart';
import '../../core/services/permission_service.dart';
import '../../core/theme/app_theme.dart';
import '../../data/offline/offline_store.dart';

/// First-run GPS + notification prompts after authentication.
class PermissionsScreen extends ConsumerStatefulWidget {
  const PermissionsScreen({
    super.key,
    required this.userId,
    required this.onFinished,
  });

  final String userId;
  final VoidCallback onFinished;

  @override
  ConsumerState<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends ConsumerState<PermissionsScreen> {
  static const _perm = PermissionService();
  static const _notify = NotificationService();

  bool _locationDone = false;
  bool _notifyDone = false;
  bool _busy = false;

  Future<void> _requestLocation() async {
    setState(() => _busy = true);
    final ok = await _perm.requestLocationWhenInUse();
    if (mounted) {
      setState(() {
        _locationDone = ok;
        _busy = false;
      });
    }
  }

  Future<void> _requestNotify() async {
    setState(() => _busy = true);
    await _notify.requestSystemPermission();
    final ok = await _perm.requestNotifications();
    if (mounted) {
      setState(() {
        _notifyDone = ok;
        _busy = false;
      });
    }
  }

  Future<void> _finish() async {
    setState(() => _busy = true);
    try {
      await _notify.scheduleCareReminders();
    } catch (_) {
      // Scheduling can fail if OS denies exact alarms; user can enable later.
    }
    await OfflineStore.instance.markPermissionsDoneForUser(widget.userId);
    if (mounted) {
      widget.onFinished();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set up your buddy')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'A few permissions help your assistant give timely, local advice.',
            style: TextStyle(color: AppColors.textMuted, height: 1.4),
          ),
          const SizedBox(height: 24),
          _StepCard(
            icon: Icons.location_on_outlined,
            title: 'Location',
            subtitle: 'Improves seasonal tips and regional crop guidance.',
            done: _locationDone,
            busy: _busy,
            actionLabel: 'Allow location',
            onPressed: _requestLocation,
          ),
          const SizedBox(height: 14),
          _StepCard(
            icon: Icons.notifications_active_outlined,
            title: 'Notifications',
            subtitle: 'Watering and fertilizer reminders on your schedule.',
            done: _notifyDone,
            busy: _busy,
            actionLabel: 'Allow notifications',
            onPressed: _requestNotify,
          ),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: _busy ? null : _finish,
            child: const Text('Continue'),
          ),
          TextButton(
            onPressed: _busy
                ? null
                : () async {
                    await OfflineStore.instance.markPermissionsDoneForUser(
                      widget.userId,
                    );
                    widget.onFinished();
                  },
            child: const Text('Skip for now'),
          ),
        ],
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  const _StepCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.done,
    required this.busy,
    required this.actionLabel,
    required this.onPressed,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool done;
  final bool busy;
  final String actionLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: AppColors.green500),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
                if (done)
                  const Icon(Icons.check_circle, color: AppColors.green500),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(color: AppColors.textMuted, height: 1.35),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: busy ? null : onPressed,
              child: Text(done ? 'Requested' : actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}
