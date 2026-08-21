import 'package:flutter/material.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  int currentStep = 0; // 0: Information, 1: Payment, 2: Review

  final _formKey = GlobalKey<FormState>();

  // Form fields
  String? fullName;
  String? email;
  String? phone;
  String? address;
  String? city;
  String? country = 'United States';
  String? postalCode;

  // Shipping options
  String selectedShipping = 'standard'; // standard, express, overnight

  // Order data
  final int itemCount = 2;
  final double subtotal = 904.00;
  final double shippingCost = 0.0;

  double get total => subtotal + shippingCost;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'abc',
          style: TextStyle(
            color: Color(0xFF1F57F7),
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Progress Indicator
            _buildProgressIndicator(),

            const SizedBox(height: 24),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Contact Information
                  _buildContactInformation(),

                  const SizedBox(height: 24),

                  // Shipping Options
                  _buildShippingOptions(),

                  const SizedBox(height: 24),

                  // Order Summary
                  _buildOrderSummary(),

                  const SizedBox(height: 24),

                  // Continue Button
                  _buildContinueButton(context),

                  const SizedBox(height: 12),

                  // Security Footer
                  Center(
                    child: Text(
                      'Secure Checkout | Your data is protected',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        children: [
          // Information Step
          _buildStepIndicator(0, 'Information', 'Information'),
          Expanded(
            child: Container(
              height: 2,
              color: currentStep > 0
                  ? const Color(0xFF1F57F7)
                  : Colors.grey[300],
            ),
          ),
          // Payment Step
          _buildStepIndicator(1, 'Payment', 'Payment'),
          Expanded(
            child: Container(
              height: 2,
              color: currentStep > 1
                  ? const Color(0xFF1F57F7)
                  : Colors.grey[300],
            ),
          ),
          // Review Step
          _buildStepIndicator(2, 'Review', 'Review'),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label, String shortLabel) {
    final isActive = step <= currentStep;
    final isCompleted = step < currentStep;

    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? const Color(0xFF1F57F7) : Colors.grey[300],
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, color: Colors.white, size: 24)
                : Text(
                    (step + 1).toString(),
                    style: TextStyle(
                      color: isActive ? Colors.white : Colors.grey,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          shortLabel,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: isActive ? const Color(0xFF1F57F7) : Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildContactInformation() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Contact Information',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                // Full Name
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.person, color: Colors.grey, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Full Name',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            TextFormField(
                              decoration: const InputDecoration(
                                border: InputBorder.none,
                                hintText: 'Dahah Sam',
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onChanged: (value) => fullName = value,
                              validator: (value) {
                                if (value?.isEmpty ?? true) {
                                  return 'Full name is required';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(height: 0, color: Colors.grey[300]),
                // Email
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.email, color: Colors.grey, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Email Address',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            TextFormField(
                              decoration: const InputDecoration(
                                border: InputBorder.none,
                                hintText: 'iamdalah@gmail.com',
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onChanged: (value) => email = value,
                              validator: (value) {
                                if (value?.isEmpty ?? true) {
                                  return 'Email is required';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(height: 0, color: Colors.grey[300]),
                // Phone
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.phone, color: Colors.grey, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Phone Number',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            TextFormField(
                              decoration: const InputDecoration(
                                border: InputBorder.none,
                                hintText: '+1 (555) 123456788',
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onChanged: (value) => phone = value,
                              validator: (value) {
                                if (value?.isEmpty ?? true) {
                                  return 'Phone number is required';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Address Section
        const Text(
          'Contact Information',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              // Address
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.grey, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Address',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          TextFormField(
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              hintText: '123 Tech Street',
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                            onChanged: (value) => address = value,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Divider(height: 0, color: Colors.grey[300]),
              // City and Country
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.home, color: Colors.grey, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'City/Country',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          TextFormField(
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              hintText: 'San Francisco',
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                            onChanged: (value) => city = value,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Divider(height: 0, color: Colors.grey[300]),
              // Postal Code
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.mail, color: Colors.grey, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Postal Code',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          TextFormField(
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              hintText: '94107',
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                            onChanged: (value) => postalCode = value,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Divider(height: 0, color: Colors.grey[300]),
              // Country Dropdown
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.public, color: Colors.grey, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButton<String>(
                        value: country,
                        isExpanded: true,
                        underline: SizedBox(),
                        items: const [
                          DropdownMenuItem(
                            value: 'United States',
                            child: Text('United States'),
                          ),
                          DropdownMenuItem(
                            value: 'Canada',
                            child: Text('Canada'),
                          ),
                          DropdownMenuItem(
                            value: 'Mexico',
                            child: Text('Mexico'),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() => country = value);
                        },
                      ),
                    ),
                    const Icon(Icons.expand_more, color: Colors.grey),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShippingOptions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Shipping Options',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        _buildShippingOption(
          'standard',
          'Standard Shipping',
          'Free shipping',
          'FREE',
          Colors.green,
        ),
        const SizedBox(height: 12),
        _buildShippingOption(
          'express',
          'Express Shipping',
          'In 2-3 business days',
          '\$6.99',
          Colors.grey,
        ),
        const SizedBox(height: 12),
        _buildShippingOption(
          'overnight',
          'Overnight Shipping',
          'In 1 business day',
          '\$12.99',
          Colors.grey,
        ),
      ],
    );
  }

  Widget _buildShippingOption(
    String value,
    String title,
    String subtitle,
    String price,
    Color priceColor,
  ) {
    final isSelected = selectedShipping == value;

    return GestureDetector(
      onTap: () => setState(() => selectedShipping = value),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? const Color(0xFF1F57F7) : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected
                      ? const Color(0xFF1F57F7)
                      : Colors.grey[300]!,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF1F57F7),
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Text(
              price,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: priceColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
        color: Colors.grey[50],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Order Summary',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              Text(
                '$itemCount items',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Subtotal',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              Text(
                '\$${subtotal.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Shipping',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              Text(
                shippingCost == 0
                    ? 'FREE'
                    : '\$${shippingCost.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 12,
                  color: shippingCost == 0 ? Colors.green : Colors.black,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: Colors.grey[300]),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              Text(
                '\$${total.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F57F7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContinueButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () {
          if (_formKey.currentState?.validate() ?? false) {
            // Navigate to payment page
            _showSuccessMessage(context);
          }
        },
        icon: const Icon(Icons.lock, size: 18),
        label: const Text('Continue to Payment'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1F57F7),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  void _showSuccessMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Information saved. Proceeding to payment...'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );

    // Move to next step
    Future.delayed(const Duration(milliseconds: 500), () {
      setState(() => currentStep = 1);
    });
  }
}
