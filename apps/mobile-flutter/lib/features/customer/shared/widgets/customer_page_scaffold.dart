import 'package:flutter/material.dart';

import '../../../../core/api/api_client.dart';
import '../../account/account_screen.dart';
import '../../cart/cart_screen.dart';
import '../../categories/categories_screen.dart';
import '../../home/home_screen.dart';
import '../../login/login_screen.dart';
import '../../visual_search/visual_search_screen.dart';
import 'cart_nav_badge_icon.dart';

class CustomerPageScaffold extends StatelessWidget {
  const CustomerPageScaffold({
    required this.title,
    required this.subtitle,
    required this.child,
    super.key,
    this.actions = const [],
    this.selectedNavIndex = 0,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final List<Widget> actions;
  final int selectedNavIndex;

  void _onBackTap(BuildContext context) {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
      return;
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const CustomerHomeScreen()),
      (route) => false,
    );
  }

  void _onBottomNavTap(BuildContext context, int index) {
    if (index == selectedNavIndex) return;

    switch (index) {
      case 0:
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(builder: (_) => const CustomerHomeScreen()),
          (route) => false,
        );
        break;
      case 1:
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(builder: (_) => const CategoriesScreen()),
          (route) => false,
        );
        break;
      case 2:
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(builder: (_) => const VisualSearchScreen()),
          (route) => false,
        );
        break;
      case 3:
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(builder: (_) => const CartScreen()),
          (route) => false,
        );
        break;
      case 4:
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(
            builder: (_) => ApiClient.isLoggedIn
                ? const CustomerAccountScreen()
                : const LoginScreen(),
          ),
          (route) => false,
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        toolbarHeight: 60,
        leadingWidth: 42,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => _onBackTap(context),
        ),
        backgroundColor: const Color(0xFFF5F7FA),
        surfaceTintColor: const Color(0xFFF5F7FA),
        shadowColor: Colors.transparent,
        foregroundColor: const Color(0xFF0B1023),
        title: Text(title),
        titleSpacing: 12,
        centerTitle: false,
        actions: actions,
      ),
      body: ColoredBox(
        color: const Color(0xFFF5F7FA),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _HeroBanner(title: title, subtitle: subtitle),
              const SizedBox(height: 14),
              child,
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedNavIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF6E9BFF),
        selectedItemColor: Colors.white,
        unselectedItemColor: const Color(0xFF1849B7),
        selectedIconTheme: const IconThemeData(color: Colors.white),
        unselectedIconTheme: const IconThemeData(color: Color(0xFF1849B7)),
        showSelectedLabels: true,
        showUnselectedLabels: true,
        onTap: (index) => _onBottomNavTap(context, index),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_rounded),
            label: 'Categories',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.image_search_rounded),
            label: 'Search',
          ),
          BottomNavigationBarItem(icon: CartNavBadgeIcon(), label: 'Cart'),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: const Color(0xFFDEDEDE),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.shopping_bag_rounded,
            size: 34,
            color: colorScheme.primary,
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF334155)),
          ),
        ],
      ),
    );
  }
}
