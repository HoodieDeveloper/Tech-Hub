import 'dart:async';
import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../../products/product.dart';
import '../../products/product_api.dart';
import '../../products/product_details_page.dart';
import '../account/account_screen.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../login/login_screen.dart';
import '../shared/customer_favorite_actions.dart';
import '../shared/widgets/cart_nav_badge_icon.dart';
import '../shared/widgets/customer_product_card.dart';
import '../visual_search/visual_search_screen.dart';
import '../wishlist/wishlist_store.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  final PageController _bannerController = PageController();
  Timer? _bannerTimer;
  int _bannerIndex = 0;
  int _navIndex = 0;
  bool _settingsOpen = false;
  late Future<List<Product>> _productsFuture;

  static const List<_BannerItem> _banners = [
    _BannerItem(
      'assets/banner_1.png',
      '',
      '',
      LinearGradient(
        colors: [Colors.transparent, Colors.transparent],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    _BannerItem(
      'assets/banner_2.png',
      '',
      '',
      LinearGradient(
        colors: [Colors.transparent, Colors.transparent],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    _BannerItem(
      'assets/banner_3.png',
      '',
      '',
      LinearGradient(
        colors: [Colors.transparent, Colors.transparent],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _productsFuture = ProductApi.getProducts();
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!_bannerController.hasClients || _banners.length < 2) {
        return;
      }

      final nextIndex = (_bannerIndex + 1) % _banners.length;
      _bannerController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  Future<void> _refreshProducts() async {
    final future = ProductApi.getProducts();
    setState(() => _productsFuture = future);
    await future;
  }

  void _toggleSettings() {
    setState(() => _settingsOpen = !_settingsOpen);
  }

  Future<void> _open(Widget page) async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => page));

    if (!mounted) {
      return;
    }

    setState(() => _navIndex = 0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: _toggleSettings,
                          icon: const Icon(
                            Icons.settings,
                            color: Color.fromARGB(255, 0, 0, 0),
                          ),
                        ),
                        Image.asset(
                          'assets/logo.jpg',
                          width: 84,
                          fit: BoxFit.contain,
                          filterQuality: FilterQuality.high,
                        ),
                        IconButton(
                          onPressed: () {},
                          icon: const Icon(
                            Icons.search,
                            color: Color.fromARGB(255, 0, 0, 0),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _refreshProducts,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _BannerCarousel(
                              controller: _bannerController,
                              banners: _banners,
                              currentIndex: _bannerIndex,
                              onPageChanged: (index) =>
                                  setState(() => _bannerIndex = index),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Featured items',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Color.fromARGB(255, 0, 0, 0),
                              ),
                            ),
                            const SizedBox(height: 12),
                            FutureBuilder<List<Product>>(
                              future: _productsFuture,
                              builder: (context, snapshot) {
                                if (snapshot.connectionState ==
                                    ConnectionState.waiting) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 40),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        color: Color(0xFFDEDEDE),
                                      ),
                                    ),
                                  );
                                }

                                if (snapshot.hasError) {
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 24,
                                    ),
                                    child: Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDEDEDE),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Column(
                                        children: [
                                          Text(
                                            snapshot.error.toString(),
                                            textAlign: TextAlign.center,
                                            style: const TextStyle(
                                              color: Color(0xFF0B1023),
                                            ),
                                          ),
                                          const SizedBox(height: 12),
                                          FilledButton.tonal(
                                            onPressed: _refreshProducts,
                                            child: const Text('Try again'),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }

                                final products =
                                    snapshot.data ?? const <Product>[];
                                if (products.isEmpty) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 40),
                                    child: Center(
                                      child: Text(
                                        'No products available right now.',
                                        style: TextStyle(
                                          color: Color(0xFFDEDEDE),
                                        ),
                                      ),
                                    ),
                                  );
                                }

                                return LayoutBuilder(
                                  builder: (context, constraints) {
                                    final width = constraints.maxWidth;
                                    final imageHeight = width < 360
                                        ? 120.0
                                        : width < 420
                                        ? 150.0
                                        : 180.0;
                                    final childAspectRatio = width < 360
                                        ? 0.82
                                        : width < 420
                                        ? 0.72
                                        : 0.64;

                                    return GridView.builder(
                                      shrinkWrap: true,
                                      physics:
                                          const NeverScrollableScrollPhysics(),
                                      itemCount: products.length,
                                      gridDelegate:
                                          SliverGridDelegateWithFixedCrossAxisCount(
                                            crossAxisCount: 2,
                                            mainAxisSpacing: 12,
                                            crossAxisSpacing: 12,
                                            childAspectRatio: childAspectRatio,
                                          ),
                                      itemBuilder: (context, index) {
                                        final product = products[index];
                                        final isFavorite = CustomerWishlist
                                            .instance
                                            .contains(product.id);

                                        return CustomerProductCard(
                                          product: product,
                                          isFavorite: isFavorite,
                                          showCategoryLabel: true,
                                          imageHeight: imageHeight,
                                          borderColor: const Color(0xFFD7E3FA),
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute<void>(
                                                builder: (_) =>
                                                    ProductDetailsPage(
                                                      productId: product.id,
                                                    ),
                                              ),
                                            );
                                          },
                                          onToggleFavorite: () async {
                                            await handleFavoriteToggle(
                                              context: context,
                                              isLoggedIn: ApiClient.isLoggedIn,
                                              productId: product.id,
                                              toggleFavorite: CustomerWishlist
                                                  .instance
                                                  .toggle,
                                              onUpdated: () => setState(() {}),
                                              loginPageBuilder: (_) =>
                                                  const LoginScreen(),
                                            );
                                          },
                                        );
                                      },
                                    );
                                  },
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_settingsOpen)
              Positioned.fill(
                child: GestureDetector(
                  onTap: _toggleSettings,
                  child: Container(color: const Color(0x66000000)),
                ),
              ),
            AnimatedPositioned(
              duration: const Duration(milliseconds: 260),
              curve: Curves.easeOutCubic,
              left: _settingsOpen ? 0 : -320,
              top: 0,
              bottom: 0,
              child: _SettingsFrame(
                logoPath: 'assets/logo.jpg',
                onClose: _toggleSettings,
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _navIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF6E9BFF),
        selectedItemColor: Colors.white,
        unselectedItemColor: const Color(0xFF1849B7),
        selectedIconTheme: const IconThemeData(color: Colors.white),
        unselectedIconTheme: const IconThemeData(color: Color(0xFF1849B7)),
        showUnselectedLabels: true,
        onTap: (index) {
          setState(() => _navIndex = index);
          switch (index) {
            case 1:
              _open(const CategoriesScreen());
              break;
            case 2:
              _open(const VisualSearchScreen());
              break;
            case 3:
              _open(const CartScreen());
              break;
            case 4:
              _open(
                ApiClient.isLoggedIn
                    ? const CustomerAccountScreen()
                    : const LoginScreen(),
              );
              break;
          }
        },
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

class _BannerCarousel extends StatelessWidget {
  const _BannerCarousel({
    required this.controller,
    required this.banners,
    required this.currentIndex,
    required this.onPageChanged,
  });

  final PageController controller;
  final List<_BannerItem> banners;
  final int currentIndex;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            controller: controller,
            itemCount: banners.length,
            onPageChanged: onPageChanged,
            itemBuilder: (context, index) {
              final banner = banners[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 18,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Image.asset(
                        banner.assetPath,
                        fit: BoxFit.cover,
                        filterQuality: FilterQuality.high,
                      ),
                    ),
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(gradient: banner.gradient),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        Positioned(
          bottom: 12,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(banners.length, (index) {
              final active = index == currentIndex;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: active ? 22 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: active ? Colors.white : const Color(0x73FFFFFF),
                  borderRadius: BorderRadius.circular(999),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _SettingsFrame extends StatefulWidget {
  const _SettingsFrame({required this.logoPath, required this.onClose});

  final String logoPath;
  final VoidCallback onClose;

  @override
  State<_SettingsFrame> createState() => _SettingsFrameState();
}

class _SettingsFrameState extends State<_SettingsFrame> {
  String language = 'ENG';
  String currency = 'USD';

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 290,
      height: double.infinity,
      decoration: const BoxDecoration(
        color: Color(0xFFF0F2F5),
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(18, 24, 18, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.settings, color: Color(0xFF1F57F7), size: 22),
              const SizedBox(width: 8),
              const Text(
                'Setting',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0B1023),
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: widget.onClose,
                icon: const Icon(Icons.close, color: Color(0xFF0B1023)),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints.tightFor(
                  width: 28,
                  height: 28,
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          const Text(
            'Language',
            style: TextStyle(fontSize: 16, color: Color(0xFF0B1023)),
          ),
          const SizedBox(height: 10),
          _ChipToggle(
            leftLabel: 'ENG',
            rightLabel: 'KH',
            selectedLeft: language == 'ENG',
            onLeftTap: () => setState(() => language = 'ENG'),
            onRightTap: () => setState(() => language = 'KH'),
          ),
          const SizedBox(height: 18),
          const Text(
            'Currency',
            style: TextStyle(fontSize: 16, color: Color(0xFF0B1023)),
          ),
          const SizedBox(height: 10),
          _ChipToggle(
            leftLabel: 'USD',
            rightLabel: 'KHR',
            selectedLeft: currency == 'USD',
            onLeftTap: () => setState(() => currency = 'USD'),
            onRightTap: () => setState(() => currency = 'KHR'),
          ),
          const Spacer(),
          Center(
            child: Image.asset(
              widget.logoPath,
              width: 62,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChipToggle extends StatelessWidget {
  const _ChipToggle({
    required this.leftLabel,
    required this.rightLabel,
    required this.selectedLeft,
    required this.onLeftTap,
    required this.onRightTap,
  });

  final String leftLabel;
  final String rightLabel;
  final bool selectedLeft;
  final VoidCallback onLeftTap;
  final VoidCallback onRightTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _PillOption(label: leftLabel, selected: selectedLeft, onTap: onLeftTap),
        const SizedBox(width: 6),
        _PillOption(
          label: rightLabel,
          selected: !selectedLeft,
          onTap: onRightTap,
        ),
      ],
    );
  }
}

class _PillOption extends StatelessWidget {
  const _PillOption({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF1F57F7) : const Color(0xFFE4ECFB),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : const Color(0xFF1849B7),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

class _BannerItem {
  const _BannerItem(this.assetPath, this.title, this.subtitle, this.gradient);

  final String assetPath;
  final String title;
  final String subtitle;
  final LinearGradient gradient;
}
