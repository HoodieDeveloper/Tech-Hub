import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final emailController = TextEditingController(text: 'admin@example.com');
  final passwordController = TextEditingController(text: 'password');
  String message = '';
  bool loading = false;

  Future<void> login() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
      final data = await ApiClient.post('/login', {
        'email': emailController.text,
        'password': passwordController.text,
      });

      ApiClient.token = data['token'];
      setState(() => message = 'Login success');
    } catch (e) {
      setState(() => message = e.toString());
    } finally {
      setState(() => loading = false);
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
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Login', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          TextField(
            controller: emailController,
            decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: passwordController,
            decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
            obscureText: true,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: loading ? null : login,
            child: loading ? const CircularProgressIndicator() : const Text('Login'),
          ),
          const SizedBox(height: 16),
          Text(message),
        ],
      ),
    );
  }
}
