import 'package:flutter/material.dart';

import '../../products/product.dart';
import '../../products/product_api.dart';
import '../../products/product_details_page.dart';
import '../../products/product_image.dart';
import '../wishlist/wishlist_store.dart';

class CustomerWishlistScreen extends StatefulWidget {
  const CustomerWishlistScreen({super.key});

  @override
  State<CustomerWishlistScreen> createState() => _CustomerWishlistScreenState();
}

class _CustomerWishlistScreenState extends State<CustomerWishlistScreen> {
  Future<List<Product>>? _wishlistFuture;
  bool _loadingWishlist = true;
  String? _wishlistLoadError;

  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  Future<void> _loadWishlist() async {
    setState(() {
      _loadingWishlist = true;
      _wishlistLoadError = null;
    });

    try {
      await CustomerWishlist.instance.load(suppressErrors: false);
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _wishlistFuture = null;
        _loadingWishlist = false;
        _wishlistLoadError = 'Unable to load your saved products.';
      });
      return;
    }

    if (!mounted) {
      return;
    }

    setState(() {
      if (CustomerWishlist.instance.productIds.isNotEmpty) {
        _wishlistFuture = ProductApi.getProducts();
      } else {
        _wishlistFuture = null;
      }
      _loadingWishlist = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('My Wishlist'),
        backgroundColor: const Color(0xFFF5F7FA),
        foregroundColor: const Color(0xFF0B1023),
      ),
      body: RefreshIndicator(
        onRefresh: _loadWishlist,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _WishlistPanel(
              future: _wishlistFuture,
              savedProductIds: CustomerWishlist.instance.productIds,
              loadingWishlist: _loadingWishlist,
              loadErrorMessage: _wishlistLoadError,
            ),
          ],
        ),
      ),
    );
  }
}

class _WishlistPanel extends StatelessWidget {
  const _WishlistPanel({
    required this.future,
    required this.savedProductIds,
    required this.loadingWishlist,
    required this.loadErrorMessage,
  });

  final Future<List<Product>>? future;
  final Set<int> savedProductIds;
  final bool loadingWishlist;
  final String? loadErrorMessage;

  @override
  Widget build(BuildContext context) {
    if (loadingWishlist) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(18),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (loadErrorMessage != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Text(loadErrorMessage!),
      );
    }

    if (savedProductIds.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Text(
          'No saved products yet.',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
      );
    }

    return FutureBuilder<List<Product>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(18),
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError || !snapshot.hasData) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Text('Unable to load your saved products.'),
          );
        }

        final products = snapshot.data!
            .where((product) => savedProductIds.contains(product.id))
            .toList();

        if (products.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Text(
              'No saved products yet.',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          );
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Saved products',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...products.map((product) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) =>
                              ProductDetailsPage(productId: product.id),
                        ),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 2,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: ProductImage(
                                imageUrl: product.imageUrl,
                                productName: product.name,
                                height: 52,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.name,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '\$${product.price.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    color: Color(0xFF1849B7),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}
