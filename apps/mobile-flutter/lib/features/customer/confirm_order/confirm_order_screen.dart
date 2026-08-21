import 'package:flutter/material.dart';

import '../order_success/order_success_screen.dart';
import '../shared/widgets/customer_page_scaffold.dart';

class ConfirmOrderScreen extends StatelessWidget {
  const ConfirmOrderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomerPageScaffold(
      title: 'Confirm order',
      subtitle: 'Final review before submitting the order.',
      selectedNavIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order details',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Items, shipping address, and payment method can all be reviewed here.',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (context) => const OrderSuccessScreen(),
                ),
              );
            },
            icon: const Icon(Icons.verified_rounded),
            label: const Text('Confirm order'),
          ),
        ],
      ),
    );
  }
}
