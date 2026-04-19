import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/env_config.dart';
import '../../core/theme/app_theme.dart';
import '../providers/app_providers.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _fullName = TextEditingController();
  bool _signup = false;

  @override
  void initState() {
    super.initState();
    final cfg = EnvConfig.instance;
    if (cfg.devLoginEmail.isNotEmpty) {
      _email.text = cfg.devLoginEmail;
    }
    if (cfg.devLoginPassword.isNotEmpty) {
      _password.text = cfg.devLoginPassword;
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _fullName.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authNotifierProvider);
    final useSupabase = EnvConfig.instance.hasSupabaseCredentials;

    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            right: -80,
            top: -80,
            child: IgnorePointer(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.green500.withValues(alpha: 0.12),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Farming Buddy',
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            useSupabase
                                ? 'Sign in with Supabase. Your session is exchanged for secure API access.'
                                : 'Create an account or sign in to sync with your crop advisor API.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textMuted,
                                ),
                          ),
                          const SizedBox(height: 18),
                          SegmentedButton<bool>(
                            segments: const [
                              ButtonSegment(
                                value: false,
                                label: Text('Login'),
                                icon: Icon(Icons.login, size: 18),
                              ),
                              ButtonSegment(
                                value: true,
                                label: Text('Sign up'),
                                icon: Icon(Icons.person_add_alt_1, size: 18),
                              ),
                            ],
                            selected: {_signup},
                            onSelectionChanged: (s) {
                              setState(() => _signup = s.first);
                            },
                          ),
                          const SizedBox(height: 20),
                          if (_signup) ...[
                            TextField(
                              controller: _fullName,
                              textCapitalization: TextCapitalization.words,
                              decoration: const InputDecoration(
                                labelText: 'Full name',
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          TextField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _password,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Password',
                            ),
                          ),
                          const SizedBox(height: 18),
                          auth.maybeWhen(
                            error: (e, _) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Text(
                                e.toString(),
                                style: const TextStyle(color: AppColors.danger),
                              ),
                            ),
                            orElse: () => const SizedBox.shrink(),
                          ),
                          FilledButton(
                            onPressed: auth.isLoading
                                ? null
                                : () async {
                                    final email = _email.text.trim();
                                    final pass = _password.text;
                                    if (email.isEmpty || pass.isEmpty) {
                                      return;
                                    }
                                    if (_signup) {
                                      final name = _fullName.text.trim();
                                      if (name.length < 2) {
                                        return;
                                      }
                                      await ref
                                          .read(authNotifierProvider.notifier)
                                          .signup(
                                            fullName: name,
                                            email: email,
                                            password: pass,
                                          );
                                    } else {
                                      await ref
                                          .read(authNotifierProvider.notifier)
                                          .login(email, pass);
                                    }
                                  },
                            child: auth.isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(_signup ? 'Create account' : 'Sign in'),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'API: ${EnvConfig.instance.apiBaseUrl}',
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: AppColors.textMuted,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
