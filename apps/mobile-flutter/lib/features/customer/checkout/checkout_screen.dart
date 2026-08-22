import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/api/api_client.dart';
import '../home/home_screen.dart';
import '../services/cart_service.dart';
import '../services/payment_service.dart';
import '../wishlist/wishlist_store.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    required this.cartItems,
    this.clearCartOnSuccess = false,
    super.key,
  });

  final List<CartItem> cartItems;
  final bool clearCartOnSuccess;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int currentStep = 0; // 0: Information, 1: Payment, 2: Review

  final _formKey = GlobalKey<FormState>();
  final _cardFormKey = GlobalKey<FormState>();

  // Form fields
  String? fullName;
  String? email;
  String? phone;
  String? address;
  String? city;

  // Shipping options
  String selectedShipping = 'standard'; // standard, express, overnight

  // Payment method state
  String selectedPaymentMethod = 'card'; // card, cashondelivery
  bool useBillingAddress = true;
  bool showAddNewCard = true; // Show card form by default
  bool submitting = false;

  // Card form fields
  String? cardNumber;
  String? cardholderName;
  String? expiryDate;
  String? cvv;

  late double subtotal;
  double get shippingCost {
    switch (selectedShipping) {
      case 'express':
        return 6.99;
      case 'overnight':
        return 12.99;
      case 'standard':
      default:
        return 0.0;
    }
  }

  @override
  void initState() {
    super.initState();
    subtotal = widget.cartItems.fold(
      0,
      (sum, item) => sum + (item.product.price * item.quantity),
    );
  }

  double get total => subtotal + shippingCost;

  void _handleBackNavigation() {
    if (currentStep > 0) {
      setState(() => currentStep--);
      return;
    }

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (currentStep > 0) {
          setState(() => currentStep--);
          return false;
        }
        return true;
      },
      child: Scaffold(
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: _handleBackNavigation,
          ),
          title: Image.asset(
            'assets/logo.jpg',
            height: 40,
            fit: BoxFit.contain,
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
                    // Show different content based on current step
                    if (currentStep == 0) ...[
                      // Contact Information
                      _buildContactInformation(),

                      const SizedBox(height: 24),

                      // Shipping Options
                      _buildShippingOptions(),
                    ] else if (currentStep == 1) ...[
                      // Payment Method
                      _buildPaymentMethod(),
                    ] else if (currentStep == 2) ...[
                      // Review & Place Order
                      _buildReviewOrder(),
                    ],

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
    const primary = Color(0xFF1F57F7);
    const border = Color(0xFFE2E8F0);

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Contact Information',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          // Full Name
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Full Name',
              hintText: 'Enter your full name',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Full name is required';
              }
              return null;
            },
            onChanged: (value) => fullName = value,
          ),
          const SizedBox(height: 12),
          // Email
          TextFormField(
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: 'Email Address',
              hintText: 'Enter your email',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Email is required';
              }
              if (!value.contains('@')) {
                return 'Enter a valid email';
              }
              return null;
            },
            onChanged: (value) => email = value,
          ),
          const SizedBox(height: 12),
          // Phone
          TextFormField(
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'Phone Number',
              hintText: 'Enter your phone number',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Phone number is required';
              }
              return null;
            },
            onChanged: (value) => phone = value,
          ),
          const SizedBox(height: 16),
          const Text(
            'Shipping Address',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          // Address
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Address',
              hintText: 'Enter your address',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Address is required';
              }
              return null;
            },
            onChanged: (value) => address = value,
          ),
          const SizedBox(height: 12),
          // City
          TextFormField(
            decoration: InputDecoration(
              labelText: 'City',
              hintText: 'Enter your city',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'City is required';
              }
              return null;
            },
            onChanged: (value) => city = value,
          ),
          const SizedBox(height: 16),
        ],
      ),
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
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
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
    final itemCount = widget.cartItems.length;

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
                '$itemCount ${itemCount == 1 ? 'item' : 'items'}',
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
    String buttonLabel;
    IconData buttonIcon;
    VoidCallback onPressed;

    if (currentStep == 0) {
      buttonLabel = 'Continue to Payment';
      buttonIcon = Icons.lock;
      onPressed = () {
        if (_formKey.currentState != null &&
            _formKey.currentState!.validate()) {
          _showSuccessMessage(context);
        }
      };
    } else if (currentStep == 1) {
      buttonLabel = 'Review Order';
      buttonIcon = Icons.arrow_forward;
      onPressed = () {
        final validCard =
            selectedPaymentMethod != 'card' ||
            (_cardFormKey.currentState != null &&
                _cardFormKey.currentState!.validate());

        if (validCard) {
          setState(() => currentStep = 2);
        }
      };
    } else {
      buttonLabel = submitting ? 'Placing Order...' : 'Place Order';
      buttonIcon = Icons.check;
      onPressed = submitting ? () {} : () => _placeOrder(context);
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(buttonIcon, size: 18),
        label: Text(buttonLabel),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1F57F7),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  Future<void> _placeOrder(BuildContext context) async {
    setState(() => submitting = true);

    try {
      final response = await ApiClient.post('/orders', {
        'customer_name': fullName!.trim(),
        'customer_email': email!.trim(),
        'customer_phone': phone!.trim(),
        'shipping_address': '${address!.trim()}, ${city!.trim()}',
        'payment_method': selectedPaymentMethod == 'cashondelivery'
            ? 'cash_on_delivery'
            : selectedPaymentMethod,
        'items': widget.cartItems
            .map(
              (item) => {
                'product_id': int.parse(item.product.id),
                'quantity': item.quantity,
              },
            )
            .toList(),
      });

      unawaited(
        CustomerWishlist.instance.removePurchasedProducts(
          widget.cartItems
              .map((item) => int.tryParse(item.product.id))
              .whereType<int>(),
        ),
      );

      if (widget.clearCartOnSuccess) {
        CartService().clearCart();
      }

      if (!mounted) return;
      final order = response is Map ? response['order'] : null;
      final orderNumber = order is Map ? order['order_number'] : null;
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Order successful'),
          content: Text(
            orderNumber == null
                ? 'Your order has been placed successfully.'
                : 'Order $orderNumber has been placed successfully.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Continue shopping'),
            ),
          ],
        ),
      );

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const CustomerHomeScreen()),
        (route) => false,
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Unable to place order: $error')));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
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

  // Payment Method Widgets
  Widget _buildPaymentMethod() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Payment Method',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        // Payment method tabs
        _buildPaymentMethodTabs(),
        const SizedBox(height: 24),
        // Content based on selected payment method
        if (selectedPaymentMethod == 'card') ...[
          _buildAddNewCardSection(),
          const SizedBox(height: 16),
          _buildBillingAddressToggle(),
        ] else if (selectedPaymentMethod == 'cashondelivery') ...[
          _buildCashOnDeliveryInfo(),
        ],
      ],
    );
  }

  Widget _buildPaymentMethodTabs() {
    return Row(
      children: [
        Expanded(
          child: _buildPaymentMethodTab(
            'card',
            'Credit/Debit',
            selectedPaymentMethod == 'card',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildPaymentMethodTab(
            'cashondelivery',
            'Cash on Delivery',
            selectedPaymentMethod == 'cashondelivery',
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodTab(String method, String label, bool isSelected) {
    const primaryColor = Color(0xFF1F57F7);

    return GestureDetector(
      onTap: () => setState(() {
        selectedPaymentMethod = method;
        showAddNewCard = false;
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Center(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              maxLines: 1,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAddNewCardSection() {
    return _buildAddNewCardForm();
  }

  Widget _buildAddNewCardForm() {
    const primary = Color(0xFF1F57F7);
    const border = Color(0xFFE2E8F0);

    return Form(
      key: _cardFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Card Details',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          // Card Number
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Card Number',
              hintText: '1234 5678 1239',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(16),
            ],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Card number is required';
              }
              if (!PaymentService.isValidCardNumber(value)) {
                return 'Invalid card number';
              }
              return null;
            },
            onChanged: (value) => cardNumber = value,
          ),
          const SizedBox(height: 12),
          // Cardholder Name
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Cardholder Name',
              hintText: 'Name on Card',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: primary, width: 1.5),
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Cardholder name is required';
              }
              return null;
            },
            onChanged: (value) => cardholderName = value,
          ),
          const SizedBox(height: 12),
          // Expiry Date and CVV Row
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Expiry Date',
                    hintText: 'MM/YY',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: primary, width: 1.5),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [_ExpiryDateInputFormatter()],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Required';
                    }
                    if (!PaymentService.isValidExpiryDate(value)) {
                      return 'Invalid';
                    }
                    return null;
                  },
                  onChanged: (value) => expiryDate = value,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  decoration: InputDecoration(
                    labelText: 'CVV',
                    hintText: '123',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: primary, width: 1.5),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Required';
                    }
                    if (!PaymentService.isValidCVV(value)) {
                      return 'Invalid';
                    }
                    return null;
                  },
                  onChanged: (value) => cvv = value,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Save Card Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _saveCardToUser(),
              icon: const Icon(Icons.save, size: 18),
              label: const Text('Save Card'),
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveCardToUser() async {
    if (_cardFormKey.currentState!.validate()) {
      try {
        // Create PaymentCard object
        final card = PaymentCard(
          cardNumber: cardNumber ?? '',
          cardholderName: cardholderName ?? '',
          expiryDate: expiryDate ?? '',
          cvv: cvv ?? '',
          cardType: PaymentService.getCardType(cardNumber ?? ''),
          last4: PaymentService.getLast4(cardNumber ?? ''),
        );

        // Save to API
        await PaymentService.saveCard(card);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Card saved successfully!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );

          // Clear form
          _cardFormKey.currentState!.reset();
          setState(() {
            cardNumber = null;
            cardholderName = null;
            expiryDate = null;
            cvv = null;
          });
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error saving card: $e'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    }
  }

  Widget _buildBillingAddressToggle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.location_on, size: 18, color: Colors.grey[600]),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Billing Address',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    'Use shipping address +ethinks',
                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Switch(
              value: useBillingAddress,
              onChanged: (value) => setState(() => useBillingAddress = value),
              activeColor: const Color(0xFF1F57F7),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCashOnDeliveryInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF1F57F7)),
        borderRadius: BorderRadius.circular(12),
        color: const Color(0xFF1F57F7).withOpacity(0.05),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info, color: const Color(0xFF1F57F7), size: 20),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Cash on Delivery',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F57F7),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Pay when your order arrives at your doorstep. Please ensure you have exact change available.',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewOrder() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Order Review',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        // Cart Items
        const Text(
          'Items',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...List.generate(widget.cartItems.length, (index) {
          final item = widget.cartItems[index];
          final imagePath = item.product.imagePath.trim();
          final isNetwork =
              imagePath.startsWith('http://') ||
              imagePath.startsWith('https://');

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: isNetwork
                      ? Image.network(
                          imagePath,
                          width: 60,
                          height: 60,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 60,
                              height: 60,
                              color: Colors.grey[200],
                              child: const Icon(
                                Icons.shopping_bag,
                                color: Colors.grey,
                              ),
                            );
                          },
                        )
                      : imagePath.isEmpty
                      ? Container(
                          width: 60,
                          height: 60,
                          color: Colors.grey[200],
                          child: const Icon(
                            Icons.shopping_bag,
                            color: Colors.grey,
                          ),
                        )
                      : Image.asset(
                          imagePath,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 60,
                              height: 60,
                              color: Colors.grey[200],
                              child: const Icon(
                                Icons.shopping_bag,
                                color: Colors.grey,
                              ),
                            );
                          },
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.product.name,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'Qty: ${item.quantity}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Text(
                  '\$${(item.product.price * item.quantity).toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F57F7),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class _ExpiryDateInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final limitedDigits = digits.substring(0, digits.length.clamp(0, 4));
    final formatted = limitedDigits.length > 2
        ? '${limitedDigits.substring(0, 2)}/${limitedDigits.substring(2)}'
        : limitedDigits;

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
