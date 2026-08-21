import 'package:flutter/material.dart';

import '../../services/cart_service.dart';

class CartNavBadgeIcon extends StatelessWidget {
  const CartNavBadgeIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<int>(
      valueListenable: CartService.cartRevision,
      builder: (context, _, __) {
        final count = CartService().totalItemCount;

        return Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.shopping_cart_rounded),
            if (count > 0)
              Positioned(
                right: -8,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  constraints: const BoxConstraints(minWidth: 16),
                  child: Text(
                    count > 99 ? '99+' : count.toString(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
