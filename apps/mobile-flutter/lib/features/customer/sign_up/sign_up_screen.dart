import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../login/login_screen.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  bool loading = false;
  bool obscurePassword = true;
  bool obscureConfirmPassword = true;
  String message = '';

  Future<void> register() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
      final dynamic response = await ApiClient.post('/register', {
        'name': nameController.text.trim(),
        'email': emailController.text.trim(),
        'password': passwordController.text,
        'password_confirmation': confirmPasswordController.text,
      }, auth: false);

      if (response is Map<String, dynamic> || response is Map) {
        setState(() => message = 'Account created. You can log in now.');
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => message = error.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF4A6CF7);
    const background = Color(0xFFF5F7FA);
    const border = Color(0xFFE2E8F0);
    const textSecondary = Color(0xFF718096);

    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back),
                  color: const Color(0xFF2D3748),
                ),
              ),
              const SizedBox(height: 20),
              Center(
                child: Image.asset(
                  'assets/logo.jpg',
                  width: 84,
                  height: 84,
                  fit: BoxFit.contain,
                  filterQuality: FilterQuality.high,
                ),
              ),
              const SizedBox(height: 40),
              const Text(
                'Create Account',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Fill in your details to get started',
                style: TextStyle(fontSize: 14, color: Color(0xFF718096)),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter your full name',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: primary, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email',
                  hintText: 'Enter your email',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: primary, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: passwordController,
                obscureText: obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: primary, width: 1.5),
                  ),
                  suffixIcon: IconButton(
                    onPressed: () =>
                        setState(() => obscurePassword = !obscurePassword),
                    icon: Icon(
                      obscurePassword ? Icons.visibility_off : Icons.visibility,
                      color: textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: confirmPasswordController,
                obscureText: obscureConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  hintText: 'Re-enter your password',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: primary, width: 1.5),
                  ),
                  suffixIcon: IconButton(
                    onPressed: () => setState(
                      () => obscureConfirmPassword = !obscureConfirmPassword,
                    ),
                    icon: Icon(
                      obscureConfirmPassword
                          ? Icons.visibility_off
                          : Icons.visibility,
                      color: textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: loading ? null : register,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Sign Up'),
                ),
              ),
              const SizedBox(height: 24),
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'or sign up with',
                      style: TextStyle(color: Color(0xFF718096)),
                    ),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: border),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.g_mobiledata,
                      color: Colors.red,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: border),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.apple,
                      color: Colors.black,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: border),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.facebook,
                      color: Colors.blue,
                      size: 24,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Center(
                child: GestureDetector(
                  onTap: () => Navigator.pushReplacement(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => const LoginScreen(),
                    ),
                  ),
                  child: RichText(
                    text: const TextSpan(
                      style: TextStyle(color: Color(0xFF718096)),
                      children: [
                        TextSpan(text: 'Already have an account? '),
                        TextSpan(
                          text: 'Login',
                          style: TextStyle(
                            color: Color(0xFF4A6CF7),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (message.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: message.startsWith('Account created')
                        ? const Color(0xFFE8F9EE)
                        : const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    message,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: message.startsWith('Account created')
                          ? const Color(0xFF1B8C59)
                          : const Color(0xFFB3261E),
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
