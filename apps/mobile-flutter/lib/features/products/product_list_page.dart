import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../auth/login_page.dart';
import 'product.dart';
import 'product_api.dart';
import 'product_details_page.dart';
import 'product_image.dart';

class ProductListPage extends StatefulWidget {
  const ProductListPage({super.key});

  @override
  State<ProductListPage> createState() => _ProductListPageState();
}

class _ProductListPageState extends State<ProductListPage> {
  late Future<List<Product>> _productsFuture;

  @override
  void initState() {
    super.initState();
    _productsFuture = ProductApi.getProducts();
  }

  Future<void> _refreshProducts() async {
    final future = ProductApi.getProducts();
    setState(() => _productsFuture = future);
    await future;
  }

  Future<void> _openProduct(Product product) async {
    if (!ApiClient.isLoggedIn) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (context) => LoginPage(
            onLoginSuccess: (user) {
              Navigator.of(context).pop();

              if (user['role'] == 'admin') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Admin account recognized. Use the web admin dashboard for management.'),
                  ),
                );
                return;
              }

              _showDetails(product.id);
            },
          ),
        ),
      );
      return;
    }

    if (ApiClient.currentRole == 'admin') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Admin controls are available in the TechHub web dashboard.'),
        ),
      );
      return;
    }

    _showDetails(product.id);
  }

  void _showDetails(int productId) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => ProductDetailsPage(productId: productId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TechHub Products'),
        actions: [
          if (ApiClient.isLoggedIn)
            IconButton(
              tooltip: 'Logout',
              onPressed: () {
                ApiClient.clearSession();
                setState(() {});
              },
              icon: const Icon(Icons.logout),
            ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Text(
              'Public catalog · ${ApiClient.baseUrl}/products',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Product>>(
              future: _productsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return _ErrorState(
                    message: snapshot.error.toString(),
                    onRetry: _refreshProducts,
                  );
                }

                final products = snapshot.data ?? const <Product>[];

                if (products.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: _refreshProducts,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 180),
                        Icon(Icons.inventory_2_outlined, size: 56),
                        SizedBox(height: 12),
                        Center(child: Text('No active products yet.')),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _refreshProducts,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    physics: const AlwaysScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 420,
                      mainAxisExtent: 345,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () => _openProduct(product),
                        child: _ProductCard(product: product),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ProductImage(imageUrl: product.imageUrl, productName: product.name),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    product.description ?? 'No description yet.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$${product.price.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                      ),
                      Text('Stock: ${product.stock}'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('Tap to login and view details'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 56),
            const SizedBox(height: 14),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}
