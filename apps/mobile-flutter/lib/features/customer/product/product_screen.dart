import 'package:flutter/material.dart';

import '../../products/product_list_page.dart';
import '../shared/widgets/customer_page_scaffold.dart';

class ProductScreen extends StatelessWidget {
  const ProductScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomerPageScaffold(
      title: 'Product',
      subtitle:
          'A customer product landing page that can point into the live product catalog.',
      selectedNavIndex: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Featured product view',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Use this screen as the customer entry point before the product details and add-to-cart flows are connected.',
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (context) => const ProductListPage(),
                        ),
                      );
                    },
                    icon: const Icon(Icons.view_module_rounded),
                    label: const Text('Open live catalog'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          const _ProductInfoTile(
            title: 'Product title',
            subtitle: 'Name, price, and inventory can be shown here.',
          ),
          const _ProductInfoTile(
            title: 'Description',
            subtitle:
                'Long-form details, features, and spec highlights belong here.',
          ),
          const _ProductInfoTile(
            title: 'Primary action',
            subtitle: 'Add to cart, buy now, or save for later.',
          ),
        ],
      ),
    );
  }
}

class _ProductInfoTile extends StatelessWidget {
  const _ProductInfoTile({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle),
      ),
    );
  }
}
