import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tech_hub_mobile/core/api/api_client.dart';
import 'package:tech_hub_mobile/features/customer/account/account_screen.dart';
import 'package:tech_hub_mobile/features/customer/wishlist/wishlist_store.dart';

void main() {
  setUp(() {
    ApiClient.clearSession();
    CustomerWishlist.instance.clear();
  });

  testWidgets('Account screen shows signed in user details', (tester) async {
    ApiClient.token = 'demo-token';
    ApiClient.currentUser = {
      'name': 'Jane Doe',
      'email': 'jane@example.com',
      'role': 'customer',
    };

    await tester.pumpWidget(const MaterialApp(home: CustomerAccountScreen()));

    expect(find.text('My Account'), findsOneWidget);
    expect(find.text('Jane Doe'), findsOneWidget);
    expect(find.text('jane@example.com'), findsOneWidget);
    expect(find.text('Wishlist'), findsOneWidget);
  });

  testWidgets(
    'Wishlist tile opens a separate wishlist screen for signed in users',
    (tester) async {
      ApiClient.token = 'demo-token';
      ApiClient.currentUser = {
        'name': 'Jane Doe',
        'email': 'jane@example.com',
        'role': 'customer',
      };

      await tester.pumpWidget(const MaterialApp(home: CustomerAccountScreen()));
      await tester.tap(find.text('Wishlist'));
      await tester.pumpAndSettle();

      expect(find.text('My Wishlist'), findsOneWidget);
      expect(find.text('No saved products yet.'), findsOneWidget);
    },
  );

  test('Wishlist API parses nested product ids from server responses', () {
    final ids = WishlistApi.parseWishlistIds({
      'data': [
        {'product_id': 4},
        {
          'product': {'id': 7},
        },
        {
          'product': {'product_id': 7},
        },
        9,
        {'id': '12'},
        {
          'product': {'id': '999'},
        },
      ],
    });

    expect(ids, [4, 7, 9, 12, 999]);
  });

  test('Wishlist API prefers product id over wishlist item id', () {
    final ids = WishlistApi.parseWishlistIds({
      'data': [
        {
          'id': 888,
          'product': {'id': 12},
        },
        {'id': 999, 'product_id': 14},
      ],
    });

    expect(ids, [12, 14]);
  });
}
