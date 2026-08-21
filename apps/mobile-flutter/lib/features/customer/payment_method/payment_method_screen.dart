import 'package:flutter/material.dart';

import '../confirm_order/confirm_order_screen.dart';
import '../shared/widgets/customer_page_scaffold.dart';

class PaymentMethodScreen extends StatefulWidget {
  const PaymentMethodScreen({super.key});

  @override
  State<PaymentMethodScreen> createState() => _PaymentMethodScreenState();
}

class _PaymentMethodScreenState extends State<PaymentMethodScreen> {
  String selectedMethod = 'card';

  @override
  Widget build(BuildContext context) {
    return CustomerPageScaffold(
      title: 'Payment method',
      subtitle:
          'Pick the payment method that should flow into the order confirmation step.',
      selectedNavIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Column(
              children: [
                _PaymentMethodTile(
                  value: 'card',
                  selectedValue: selectedMethod,
                  title: 'Card',
                  subtitle: 'Debit or credit card on file.',
                  onSelected: (value) {
                    setState(() => selectedMethod = value);
                  },
                ),
                const Divider(height: 1),
                _PaymentMethodTile(
                  value: 'cash',
                  selectedValue: selectedMethod,
                  title: 'Cash on delivery',
                  subtitle: 'Pay when the order arrives.',
                  onSelected: (value) {
                    setState(() => selectedMethod = value);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (context) => const ConfirmOrderScreen(),
                ),
              );
            },
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text('Continue to confirmation'),
          ),
        ],
      ),
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  const _PaymentMethodTile({
    required this.value,
    required this.selectedValue,
    required this.title,
    required this.subtitle,
    required this.onSelected,
  });

  final String value;
  final String selectedValue;
  final String title;
  final String subtitle;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final isSelected = selectedValue == value;

    return InkWell(
      onTap: () => onSelected(value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(
              isSelected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: isSelected
                  ? Theme.of(context).colorScheme.primary
                  : Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(subtitle),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
