class CustomerOrder {
  const CustomerOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.total,
    required this.currency,
    required this.createdAt,
    required this.items,
  });

  final int id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final double total;
  final String currency;
  final DateTime? createdAt;
  final List<CustomerOrderItem> items;

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  String get effectivePaymentStatus {
    final normalizedStatus = paymentStatus.trim().toLowerCase();
    final normalizedMethod = paymentMethod.trim().toLowerCase();

    if (normalizedStatus == 'unpaid' && _isCardMethod(normalizedMethod)) {
      return 'paid';
    }

    return paymentStatus;
  }

  String get paymentStatusLabel {
    final normalized = effectivePaymentStatus.trim().toLowerCase();

    if (normalized == 'paid') {
      return 'Paid';
    }

    if (normalized == 'unpaid') {
      return 'Unpaid';
    }

    if (normalized.isEmpty) {
      return 'Unpaid';
    }

    return _toTitleCase(normalized);
  }

  factory CustomerOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
              .whereType<Map>()
              .map(
                (item) =>
                    CustomerOrderItem.fromJson(Map<String, dynamic>.from(item)),
              )
              .toList()
        : const <CustomerOrderItem>[];

    return CustomerOrder(
      id: _asInt(json['id']),
      orderNumber: _asString(json['order_number'], fallback: 'N/A'),
      status: _asString(json['status'], fallback: 'pending'),
      paymentStatus: _asString(json['payment_status'], fallback: 'unpaid'),
      paymentMethod: _asString(json['payment_method']),
      total: _asDouble(json['total']),
      currency: _asString(json['currency'], fallback: 'USD'),
      createdAt: _asDateTime(json['created_at']),
      items: items,
    );
  }
}

class CustomerOrderItem {
  const CustomerOrderItem({
    required this.productName,
    required this.quantity,
    required this.lineTotal,
  });

  final String productName;
  final int quantity;
  final double lineTotal;

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) {
    return CustomerOrderItem(
      productName: _asString(json['product_name'], fallback: 'Product'),
      quantity: _asInt(json['quantity'], fallback: 0),
      lineTotal: _asDouble(json['line_total']),
    );
  }
}

int _asInt(dynamic value, {int fallback = 0}) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  if (value is String) {
    return int.tryParse(value) ?? fallback;
  }

  return fallback;
}

double _asDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  if (value is String) {
    return double.tryParse(value) ?? 0;
  }

  return 0;
}

String _asString(dynamic value, {String fallback = ''}) {
  if (value == null) {
    return fallback;
  }

  final parsed = value.toString().trim();
  if (parsed.isEmpty) {
    return fallback;
  }

  return parsed;
}

DateTime? _asDateTime(dynamic value) {
  if (value is! String || value.trim().isEmpty) {
    return null;
  }

  return DateTime.tryParse(value);
}

bool _isCardMethod(String normalizedMethod) {
  return normalizedMethod == 'card' ||
      normalizedMethod == 'credit_card' ||
      normalizedMethod == 'credit-card' ||
      normalizedMethod == 'debit_card' ||
      normalizedMethod == 'debit-card';
}

String _toTitleCase(String value) {
  return value
      .replaceAll('_', ' ')
      .replaceAll('-', ' ')
      .split(' ')
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}
