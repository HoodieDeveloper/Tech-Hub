import 'package:flutter/material.dart';
import '../../../../core/theme.dart';
import '../../../core/api/api_client.dart';
import '../home/home_screen.dart';
import '../services/cart_service.dart';
import '../checkout/checkout_screen.dart';
import '../login/login_screen.dart';

Widget _buildCartProductImage(
  String imagePath, {
  double width = 100,
  double height = 100,
}) {
  final trimmedPath = imagePath.trim();
  final isNetwork =
      trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://');

  if (isNetwork) {
    return Image.network(
      trimmedPath,
      width: width,
      height: height,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        return Container(
          width: width,
          height: height,
          color: AppColors.background,
          child: const Icon(Icons.broken_image),
        );
      },
    );
  }

  if (trimmedPath.isEmpty) {
    return Container(
      width: width,
      height: height,
      color: AppColors.background,
      child: const Icon(Icons.image_not_supported_outlined),
    );
  }

  return Image.asset(
    trimmedPath,
    width: width,
    height: height,
    fit: BoxFit.cover,
    errorBuilder: (context, error, stackTrace) {
      return Container(
        width: width,
        height: height,
        color: AppColors.background,
        child: const Icon(Icons.broken_image),
      );
    },
  );
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();

  Future<bool> _ensureLoggedInForCheckout() async {
    if (ApiClient.isLoggedIn) {
      return true;
    }

    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const LoginScreen()));

    return ApiClient.isLoggedIn;
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = _cartService.items;
    final total = _cartService.total;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
              return;
            }

            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute<void>(
                builder: (_) => const CustomerHomeScreen(),
              ),
              (route) => false,
            );
          },
        ),
        title: const Text('Your Cart'),
        actions: [
          if (cartItems.isNotEmpty)
            TextButton(
              onPressed: () {
                setState(() {
                  _cartService.clearCart();
                });
              },
              child: const Text('Clear All'),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: cartItems.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shopping_cart_outlined,
                          size: 100,
                          color: AppColors.border,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Your cart is empty',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Add items to get started',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cartItems.length,
                    itemBuilder: (context, index) {
                      final item = cartItems[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: _buildCartProductImage(
                                item.product.imagePath,
                                width: 100,
                                height: 100,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '\$${item.product.price}',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Container(
                                        decoration: BoxDecoration(
                                          border: Border.all(
                                            color: AppColors.border,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            IconButton(
                                              icon: const Icon(
                                                Icons.remove,
                                                size: 16,
                                              ),
                                              onPressed: () {
                                                setState(() {
                                                  _cartService.updateQuantity(
                                                    item.product.id,
                                                    item.quantity - 1,
                                                  );
                                                });
                                              },
                                            ),
                                            Text('${item.quantity}'),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.add,
                                                size: 16,
                                              ),
                                              onPressed: () {
                                                setState(() {
                                                  _cartService.updateQuantity(
                                                    item.product.id,
                                                    item.quantity + 1,
                                                  );
                                                });
                                              },
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Spacer(),
                                      IconButton(
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          color: Colors.red,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _cartService.removeItem(
                                              item.product.id,
                                            );
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          // Order Summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Order Summary',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(onPressed: () {}, child: const Text('Edit')),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtotal'),
                    Text(
                      '\$${total.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Shipping'),
                    const Text(
                      'Free',
                      style: TextStyle(color: AppColors.success),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Enter discount code',
                    suffixIcon: TextButton(
                      onPressed: () {},
                      child: const Text('Apply'),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '\$${total.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final canCheckout = await _ensureLoggedInForCheckout();
                      if (!canCheckout || !mounted) {
                        return;
                      }

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => CheckoutScreen(
                            cartItems: cartItems,
                            clearCartOnSuccess: true,
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(56),
                    ),
                    child: const Text('Proceed to Checkout'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
