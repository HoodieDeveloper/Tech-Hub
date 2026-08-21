import 'package:flutter/material.dart';

import '../product/product_screen.dart';
import '../shared/widgets/customer_page_scaffold.dart';

class VisualSearchScreen extends StatelessWidget {
  const VisualSearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomerPageScaffold(
      title: 'Visual search',
      subtitle:
          'Snap a product photo and discover matching items in the catalog.',
      selectedNavIndex: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Icon(
                    Icons.image_search_rounded,
                    size: 68,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Upload or scan an image',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'This is a visual product finder mockup: tap below to simulate a picture-based search.',
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.camera_alt_rounded),
                          label: const Text('Take photo'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.upload_rounded),
                          label: const Text('Upload'),
                        ),
                      ),
                    ],
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
                  builder: (context) => const ProductScreen(),
                ),
              );
            },
            icon: const Icon(Icons.storefront_rounded),
            label: const Text('Browse matching products'),
          ),
        ],
      ),
    );
  }
}
