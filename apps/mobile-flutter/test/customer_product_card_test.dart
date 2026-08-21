import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tech_hub_mobile/features/customer/shared/widgets/customer_product_card.dart';
import 'package:tech_hub_mobile/features/products/product.dart';

void main() {
  testWidgets(
    'Customer product card renders a dedicated image panel background',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomerProductCard(
              product: const Product(
                id: 1,
                name: 'Smart Speaker',
                price: 89.99,
                stock: 5,
                imageUrl: 'https://example.com/speaker.png',
              ),
              isFavorite: false,
              onTap: () {},
              onToggleFavorite: () {},
              imageHeight: 170,
            ),
          ),
        ),
      );

      final imagePanel = tester
          .widgetList<Container>(find.byType(Container))
          .firstWhere((container) {
            final decoration = container.decoration;
            return decoration is BoxDecoration &&
                decoration.color == Colors.white;
          }, orElse: () => Container());

      expect(imagePanel.decoration, isA<BoxDecoration>());
      expect((imagePanel.decoration as BoxDecoration).color, Colors.white);
    },
  );

  testWidgets('Compact card layout does not overflow on narrow widths', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 700));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 320,
            child: GridView.builder(
              itemCount: 1,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.82,
              ),
              itemBuilder: (context, index) {
                return CustomerProductCard(
                  product: const Product(
                    id: 1,
                    name: 'Very long product name that could overflow',
                    price: 89.99,
                    stock: 5,
                    imageUrl: 'https://example.com/speaker.png',
                  ),
                  isFavorite: false,
                  onTap: () {},
                  onToggleFavorite: () {},
                  imageHeight: 120,
                );
              },
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
  });
}
