import 'package:flutter_test/flutter_test.dart';
import 'package:tech_hub_mobile/features/products/product.dart';

void main() {
  test('Product reads Laravel price and Supabase image URL', () {
    const imageUrl =
        'https://example.supabase.co/storage/v1/object/public/product-images/laptop.jpg';

    final product = Product.fromJson({
      'id': 1,
      'name': 'Laptop',
      'description': 'Test product',
      'price': '899.99',
      'stock': 5,
      'image_url': imageUrl,
    });

    expect(product.id, 1);
    expect(product.name, 'Laptop');
    expect(product.price, 899.99);
    expect(product.stock, 5);
    expect(product.imageUrl, imageUrl);
  });

  test('Product handles null image URL', () {
    final product = Product.fromJson({
      'id': 2,
      'name': 'Mouse',
      'price': 15,
      'stock': 8,
      'image_url': null,
    });

    expect(product.imageUrl, isNull);
  });
}
