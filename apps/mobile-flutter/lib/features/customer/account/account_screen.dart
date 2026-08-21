import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../home/home_screen.dart';
import '../login/login_screen.dart';
import 'orders_screen.dart';
import 'settings_screen.dart';
import 'wishlist_screen.dart';
import '../wishlist/wishlist_store.dart';

class CustomerAccountScreen extends StatefulWidget {
  const CustomerAccountScreen({super.key});

  @override
  State<CustomerAccountScreen> createState() => _CustomerAccountScreenState();
}

class _CustomerAccountScreenState extends State<CustomerAccountScreen> {
  bool _navigatingToLogin = false;

  bool get _isLoggedIn => ApiClient.isLoggedIn;

  String get _displayName {
    final user = ApiClient.currentUser ?? const {};
    final name = user['name'] ?? user['full_name'];
    if (name != null && name.toString().trim().isNotEmpty) {
      return name.toString();
    }
    return 'Customer';
  }

  String get _displayEmail {
    final user = ApiClient.currentUser ?? const {};
    final email = user['email'];
    if (email != null && email.toString().trim().isNotEmpty) {
      return email.toString();
    }
    return 'No email provided';
  }

  String get _displayRole {
    final user = ApiClient.currentUser ?? const {};
    final role = user['role'];
    if (role != null && role.toString().trim().isNotEmpty) {
      return role.toString();
    }
    return 'customer';
  }

  Future<void> _logout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Log out'),
          content: const Text('Are you sure you want to log out?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Log out'),
            ),
          ],
        );
      },
    );

    if (shouldLogout != true) {
      return;
    }

    CustomerWishlist.instance.clear();
    ApiClient.clearSession();

    if (!mounted) return;
    _goToLogin();
  }

  void _goToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  void _goHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const CustomerHomeScreen()),
      (route) => false,
    );
  }

  void _openOrders() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CustomerOrdersScreen()),
    );
  }

  void _openWishlist() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CustomerWishlistScreen()),
    );
  }

  void _openSettings() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CustomerSettingsScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoggedIn) {
      if (!_navigatingToLogin) {
        _navigatingToLogin = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _goToLogin();
          }
        });
      }

      return const Scaffold(
        backgroundColor: Color(0xFFF5F7FA),
        body: SafeArea(child: Center(child: CircularProgressIndicator())),
      );
    }

    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _goHome,
        ),
        title: const Text('My Account'),
        backgroundColor: const Color(0xFFF5F7FA),
        foregroundColor: const Color(0xFF0B1023),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0F000000),
                      blurRadius: 14,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: const Color(0xFF4A6CF7),
                      child: Text(
                        _displayName.isNotEmpty
                            ? _displayName.substring(0, 1).toUpperCase()
                            : 'C',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _displayName,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _displayEmail,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEAF2FF),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              _displayRole.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF1849B7),
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _AccountTile(
                icon: Icons.local_shipping_outlined,
                title: 'Orders',
                subtitle: 'Track and manage your purchases',
                onTap: _openOrders,
              ),
              const SizedBox(height: 12),
              _AccountTile(
                icon: Icons.favorite_border_rounded,
                title: 'Wishlist',
                subtitle: 'Saved products and favourites',
                onTap: _openWishlist,
              ),
              const SizedBox(height: 12),
              _AccountTile(
                icon: Icons.settings_outlined,
                title: 'Settings',
                subtitle: 'Preferences and account controls',
                onTap: _openSettings,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _logout,
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Log out'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4A6CF7),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color(0xFFE2E8F0)),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: const Color(0xFF1849B7)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
          ],
        ),
      ),
    );
  }
}
