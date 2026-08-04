import 'package:flutter/material.dart';

import 'product.dart';
import 'product_api.dart';
import 'product_image.dart';

class ProductDetailsPage extends StatefulWidget {
  const ProductDetailsPage({required this.productId, super.key});

  final int productId;

  @override
  State<ProductDetailsPage> createState() => _ProductDetailsPageState();
}

class _ProductDetailsPageState extends State<ProductDetailsPage> {
  late Future<Product> productFuture;

  @override
  void initState() {
    super.initState();
    productFuture = ProductApi.getProduct(widget.productId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Product details')),
      body: FutureBuilder<Product>(
        future: productFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(snapshot.error.toString(), textAlign: TextAlign.center),
              ),
            );
          }

          final product = snapshot.data!;
          return ListView(
            children: [
              ProductImage(
                imageUrl: product.imageUrl,
                productName: product.name,
                height: 310,
              ),
              Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 10),
                    Text(product.description ?? 'No description yet.'),
                    const SizedBox(height: 18),
                    Text(
                      '\$${product.price.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text('Stock: ${product.stock}'),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: product.stock > 0 ? () {} : null,
                        icon: const Icon(Icons.add_shopping_cart),
                        label: const Text('Add to cart (next feature)'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
