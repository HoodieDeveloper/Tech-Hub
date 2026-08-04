import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';

typedef LoginSuccess = void Function(Map<String, dynamic> user);

class LoginPage extends StatefulWidget {
  const LoginPage({required this.onLoginSuccess, super.key});

  final LoginSuccess onLoginSuccess;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  String message = '';
  bool loading = false;

  Future<void> login() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
      final dynamic data = await ApiClient.post(
        '/login',
        {
          'email': emailController.text.trim(),
          'password': passwordController.text,
        },
        auth: false,
      );

      if (data is! Map<String, dynamic>) {
        throw const ApiException('Login response is invalid.');
      }

      final dynamic userData = data['user'];
      final dynamic tokenData = data['token'];

      if (userData is! Map || tokenData is! String) {
        throw const ApiException('Login response is incomplete.');
      }

      final user = Map<String, dynamic>.from(userData);
      ApiClient.token = tokenData;
      ApiClient.currentUser = user;

      if (!mounted) return;
      widget.onLoginSuccess(user);
    } catch (error) {
      if (!mounted) return;
      setState(() => message = error.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Icon(
            Icons.lock_person_outlined,
            size: 72,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 18),
          Text(
            'Login to continue',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Everyone can browse products. Login is required only after opening a product.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          TextField(
            controller: emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: passwordController,
            decoration: const InputDecoration(
              labelText: 'Password',
              border: OutlineInputBorder(),
            ),
            obscureText: true,
            onSubmitted: (_) => loading ? null : login(),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: loading ? null : login,
            child: loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Login'),
          ),
          if (message.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
        ],
      ),
    );
  }
}
