import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../customer/checkout/checkout_screen.dart';
import '../customer/login/login_screen.dart';
import '../customer/services/cart_service.dart' as cart_models;
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
  int _quantity = 1;
  int _selectedImageIndex = 0;
  Map<String, String> _selectedSpecs = {};

  @override
  void initState() {
    super.initState();
    productFuture = ProductApi.getProduct(widget.productId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Product details'), centerTitle: true),
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
                child: Text(
                  snapshot.error.toString(),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final product = snapshot.data!;
          final discount = product.originalPrice != null
              ? (((product.originalPrice! - product.price) /
                            product.originalPrice!) *
                        100)
                    .toInt()
              : 0;

          return ListView(
            children: [
              // Image Gallery
              _buildImageGallery(product),
              const SizedBox(height: 16),

              // Product Info Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product title
                    _buildTitle(context, product),
                    const SizedBox(height: 16),

                    // Price Section
                    _buildPriceSection(context, product, discount),
                    const SizedBox(height: 16),

                    // Stock Status
                    _buildStockStatus(context, product),
                    const SizedBox(height: 16),

                    // Specifications
                    if (product.specs != null && product.specs!.isNotEmpty)
                      _buildSpecifications(context, product),

                    // Quantity Selector
                    _buildQuantitySelector(context),
                    const SizedBox(height: 24),

                    // Description
                    if (product.description != null) ...[
                      _buildDescription(context, product),
                      const SizedBox(height: 24),
                    ],

                    // Action Buttons
                    _buildActionButtons(context, product),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          );
        },
      ),
    );
  }

  Widget _buildImageGallery(Product product) {
    final images =
        product.imageUrls ?? [product.imageUrl].whereType<String>().toList();

    if (images.isEmpty) {
      return SizedBox(
        height: 280,
        child: Container(
          color: Colors.grey[200],
          child: const Center(child: Icon(Icons.image_not_supported, size: 48)),
        ),
      );
    }

    return Column(
      children: [
        // Main Image
        SizedBox(
          height: 280,
          width: double.infinity,
          child: ProductImage(
            imageUrl: images[_selectedImageIndex],
            productName: product.name,
            height: 280,
          ),
        ),

        // Thumbnail Gallery
        if (images.length > 1)
          Padding(
            padding: const EdgeInsets.all(12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(
                  images.length,
                  (index) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedImageIndex = index),
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _selectedImageIndex == index
                                ? Theme.of(context).colorScheme.primary
                                : Colors.grey[300]!,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Image.network(
                          images[index],
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const Icon(Icons.image_not_supported),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildTitle(BuildContext context, Product product) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          product.name,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildPriceSection(
    BuildContext context,
    Product product,
    int discount,
  ) {
    return Row(
      children: [
        Text(
          '\$${product.price.toStringAsFixed(2)}',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(width: 8),
        if (product.originalPrice != null)
          Text(
            '\$${product.originalPrice!.toStringAsFixed(2)}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              decoration: TextDecoration.lineThrough,
              color: Colors.grey,
            ),
          ),
        const Spacer(),
        if (discount > 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '-$discount%',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStockStatus(BuildContext context, Product product) {
    final isInStock = product.inStock ?? product.stock > 0;
    final statusColor = isInStock ? Colors.green : Colors.red;
    final statusText = isInStock ? 'In Stock' : 'Out of Stock';

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            statusText,
            style: TextStyle(
              color: statusColor,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Text(
          'Stock: ${product.stock}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildSpecifications(BuildContext context, Product product) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Specifications',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...product.specs!.entries.map((spec) {
          final currentValue = _selectedSpecs[spec.key];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  spec.key,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(currentValue ?? spec.value),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildQuantitySelector(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quantity',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove),
                onPressed: _quantity > 1
                    ? () => setState(() => _quantity--)
                    : null,
              ),
              SizedBox(
                width: 60,
                child: Center(
                  child: Text(
                    _quantity.toString(),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => setState(() => _quantity++),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context, Product product) {
    final isInStock = product.inStock ?? product.stock > 0;

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: isInStock ? () => _addToCart(product) : null,
            icon: const Icon(Icons.add_shopping_cart),
            label: const Text('Add to Cart'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: isInStock ? () => _buyNow(product) : null,
            child: const Text('Buy now'),
          ),
        ),
      ],
    );
  }

  Widget _buildDescription(BuildContext context, Product product) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Description',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          product.description!,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }

  void _addToCart(Product product) {
    final cartProduct = cart_models.Product(
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      imagePath: (product.imageUrls != null && product.imageUrls!.isNotEmpty)
          ? product.imageUrls!.first
          : (product.imageUrl ?? ''),
    );

    cart_models.CartService().addItem(cartProduct, quantity: _quantity);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added $_quantity ${product.name}(s) to cart'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<bool> _ensureLoggedInForCheckout() async {
    if (ApiClient.isLoggedIn) {
      return true;
    }

    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const LoginScreen()));

    return ApiClient.isLoggedIn;
  }

  Future<void> _buyNow(Product product) async {
    final canCheckout = await _ensureLoggedInForCheckout();
    if (!canCheckout || !mounted) {
      return;
    }

    final checkoutProduct = cart_models.Product(
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      imagePath: (product.imageUrls != null && product.imageUrls!.isNotEmpty)
          ? product.imageUrls!.first
          : (product.imageUrl ?? ''),
    );

    final checkoutItem = cart_models.CartItem(
      product: checkoutProduct,
      quantity: _quantity,
    );

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckoutScreen(cartItems: [checkoutItem]),
      ),
    );
  }
}
