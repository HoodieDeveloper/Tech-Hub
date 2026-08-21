import 'package:flutter/material.dart';

import '../home/home_screen.dart';
import '../shared/widgets/customer_page_scaffold.dart';

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomerPageScaffold(
      title: 'Order success',
      subtitle: 'The final success screen after checkout is complete.',
      selectedNavIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    size: 68,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Your order is complete',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'The order number, receipt, and delivery tracking can be added here later.',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute<void>(
                  builder: (context) => const CustomerHomeScreen(),
                ),
                (route) => false,
              );
            },
            child: const Text('Back to home'),
          ),
        ],
      ),
    );
  }
}
