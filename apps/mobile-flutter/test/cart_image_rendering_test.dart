import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tech_hub_mobile/features/customer/cart/cart_screen.dart';
import 'package:tech_hub_mobile/features/customer/checkout/checkout_screen.dart';
import 'package:tech_hub_mobile/features/customer/services/cart_service.dart'
    as cart_models;

void main() {
  setUp(() {
    final cartService = cart_models.CartService();
    cartService.clearCart();
  });

  testWidgets(
    'Cart screen renders network product images for URL-based items',
    (tester) async {
      final cartService = cart_models.CartService();
      cartService.addItem(
        cart_models.Product(
          id: 'p1',
          name: 'Sony WH-CH520',
          price: 40,
          imagePath: 'https://example.com/product.png',
        ),
        quantity: 1,
      );

      await tester.pumpWidget(const MaterialApp(home: CartScreen()));

      final imageWidgets = tester.widgetList<Image>(find.byType(Image));
      expect(
        imageWidgets.any((image) => image.image is NetworkImage),
        isTrue,
        reason: 'Cart should show the product image from the network URL.',
      );
    },
  );

  testWidgets('Checkout review renders product images for URL-based items', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: CheckoutScreen(
          cartItems: [
            cart_models.CartItem(
              product: cart_models.Product(
                id: 'p1',
                name: 'Sony WH-CH520',
                price: 40,
                imagePath: 'https://example.com/product.png',
              ),
              quantity: 1,
            ),
          ],
        ),
      ),
    );

    final state = tester.state(find.byType(CheckoutScreen)) as dynamic;
    state.setState(() => state.currentStep = 2);
    await tester.pumpAndSettle();

    final imageWidgets = tester.widgetList<Image>(find.byType(Image));
    expect(
      imageWidgets.any((image) => image.image is NetworkImage),
      isTrue,
      reason:
          'Checkout review should show the product image from the network URL.',
    );
  });
}
