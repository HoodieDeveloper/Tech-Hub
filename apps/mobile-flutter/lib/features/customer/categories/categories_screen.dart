import 'package:flutter/material.dart';

import '../../../../core/api/api_client.dart';
import '../../../../core/theme.dart';
import '../../products/product.dart';
import '../../products/product_api.dart';
import '../../products/product_details_page.dart';
import '../account/account_screen.dart';
import '../cart/cart_screen.dart';
import '../categories/category.dart';
import '../categories/category_api.dart';
import '../home/home_screen.dart';
import '../login/login_screen.dart';
import '../shared/customer_favorite_actions.dart';
import '../shared/widgets/cart_nav_badge_icon.dart';
import '../shared/widgets/customer_product_card.dart';
import '../visual_search/visual_search_screen.dart';
import '../wishlist/wishlist_store.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  late Future<List<Product>> _productsFuture;
  late Future<List<Category>> _categoriesFuture;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _categoriesFuture = CategoryApi.getCategories();
    _productsFuture = ProductApi.getProducts();
  }

  Future<void> _refreshProducts() async {
    final futureProducts = ProductApi.getProducts(forceRefresh: true);
    final futureCategories = CategoryApi.getCategories();

    setState(() {
      _productsFuture = futureProducts;
      _categoriesFuture = futureCategories;
    });

    await Future.wait([futureProducts, futureCategories]);
  }

  List<_FilterItem> _buildFilters(List<Category> categories) {
    final filters = <_FilterItem>[
      const _FilterItem('All', Icons.grid_view_rounded),
    ];

    for (final category in categories) {
      filters.add(
        _FilterItem(
          category.name,
          _iconForCategory(category.slug, category.name),
        ),
      );
    }

    return filters;
  }

  bool _matchesFilter(Product product, List<_FilterItem> filters) {
    final selectedLabel = filters[_selectedIndex].label;
    if (selectedLabel == 'All') {
      return true;
    }

    final categoryName = (product.categoryName ?? product.categorySlug ?? '')
        .toLowerCase();
    final selectedName = selectedLabel.toLowerCase();

    return categoryName.contains(selectedName) ||
        product.name.toLowerCase().contains(selectedName) ||
        (product.categoryName ?? '').toLowerCase() == selectedName;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        toolbarHeight: 60,
        leadingWidth: 42,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          color: AppColors.primary,
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: const Text('Categories'),
        titleSpacing: 12,
        centerTitle: false,
      ),
      body: SafeArea(
        child: FutureBuilder<List<Category>>(
          future: _categoriesFuture,
          builder: (context, categorySnapshot) {
            final categoryFilters = _buildFilters(
              categorySnapshot.data ?? const <Category>[],
            );

            return FutureBuilder<List<Product>>(
              future: _productsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            snapshot.error.toString(),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: _refreshProducts,
                            child: const Text('Try again'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final products = snapshot.data ?? const <Product>[];
                final visibleProducts = products
                    .where(
                      (product) => _matchesFilter(product, categoryFilters),
                    )
                    .toList();

                return RefreshIndicator(
                  onRefresh: _refreshProducts,
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: SizedBox(
                          height: 38,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: categoryFilters.length,
                            separatorBuilder: (context, index) =>
                                const SizedBox(width: 8),
                            itemBuilder: (context, index) {
                              final filter = categoryFilters[index];
                              final selected = index == _selectedIndex;
                              return _FilterChip(
                                label: filter.label,
                                icon: filter.icon,
                                selected: selected,
                                onTap: () =>
                                    setState(() => _selectedIndex = index),
                              );
                            },
                          ),
                        ),
                      ),
                      Expanded(
                        child: visibleProducts.isEmpty
                            ? const Center(
                                child: Text(
                                  'No products found for this category.',
                                ),
                              )
                            : LayoutBuilder(
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
                                    padding: const EdgeInsets.fromLTRB(
                                      16,
                                      8,
                                      16,
                                      20,
                                    ),
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: 2,
                                          mainAxisSpacing: 12,
                                          crossAxisSpacing: 12,
                                          childAspectRatio: childAspectRatio,
                                        ),
                                    itemCount: visibleProducts.length,
                                    itemBuilder: (context, index) {
                                      final product = visibleProducts[index];
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
                              ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1,
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF6E9BFF),
        selectedItemColor: Colors.white,
        unselectedItemColor: const Color(0xFF1849B7),
        selectedIconTheme: const IconThemeData(color: Colors.white),
        unselectedIconTheme: const IconThemeData(color: Color(0xFF1849B7)),
        showSelectedLabels: true,
        showUnselectedLabels: true,
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute<void>(
                  builder: (_) => const CustomerHomeScreen(),
                ),
                (route) => false,
              );
              break;
            case 1:
              break;
            case 2:
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const VisualSearchScreen(),
                ),
              );
              break;
            case 3:
              Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const CartScreen()),
              );
              break;
            case 4:
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => ApiClient.isLoggedIn
                      ? const CustomerAccountScreen()
                      : const LoginScreen(),
                ),
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

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF1849B7) : const Color(0xFFEAF2FF),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? Colors.white : const Color(0xFF1849B7),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : const Color(0xFF1849B7),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterItem {
  const _FilterItem(this.label, this.icon);

  final String label;
  final IconData icon;
}

IconData _iconForCategory(String slug, String name) {
  final normalized = slug.toLowerCase();
  final normalizedName = name.toLowerCase();

  if (normalized.contains('laptop') || normalizedName.contains('laptop')) {
    return Icons.laptop_mac_rounded;
  }
  if (normalized.contains('phone') || normalizedName.contains('phone')) {
    return Icons.smartphone_rounded;
  }
  if (normalized.contains('audio') ||
      normalizedName.contains('audio') ||
      normalizedName.contains('headphone')) {
    return Icons.headphones_rounded;
  }
  if (normalized.contains('watch') || normalizedName.contains('watch')) {
    return Icons.watch_rounded;
  }
  if (normalized.contains('game') || normalizedName.contains('game')) {
    return Icons.sports_esports_rounded;
  }
  if (normalized.contains('home') || normalizedName.contains('home')) {
    return Icons.home_rounded;
  }
  if (normalized.contains('accessory') ||
      normalizedName.contains('accessory')) {
    return Icons.devices_other_rounded;
  }

  return Icons.category_rounded;
}
