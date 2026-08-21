import 'package:flutter/foundation.dart';

class Product {
  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.imagePath,
  });

  final String id;
  final String name;
  final double price;
  final String imagePath;
}

class CartItem {
  CartItem({required this.product, required this.quantity});

  final Product product;
  int quantity;
}

class CartService {
  static final List<CartItem> _items = [];
  static final ValueNotifier<int> cartRevision = ValueNotifier<int>(0);

  List<CartItem> get items => List.unmodifiable(_items);
  int get totalItemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  static void _notifyChanged() {
    cartRevision.value++;
  }

  void addItem(Product product, {int quantity = 1}) {
    if (quantity <= 0) {
      return;
    }

    final index = _items.indexWhere((item) => item.product.id == product.id);
    if (index == -1) {
      _items.add(CartItem(product: product, quantity: quantity));
      _notifyChanged();
      return;
    }

    _items[index].quantity += quantity;
    _notifyChanged();
  }

  double get total =>
      _items.fold(0, (sum, item) => sum + (item.product.price * item.quantity));

  void clearCart() {
    if (_items.isEmpty) {
      return;
    }

    _items.clear();
    _notifyChanged();
  }

  void removeItem(String productId) {
    final beforeCount = _items.length;
    _items.removeWhere((item) => item.product.id == productId);
    if (_items.length != beforeCount) {
      _notifyChanged();
    }
  }

  void updateQuantity(String productId, int quantity) {
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index == -1) {
      return;
    }

    if (quantity <= 0) {
      _items.removeAt(index);
      _notifyChanged();
      return;
    }

    _items[index].quantity = quantity;
    _notifyChanged();
  }
}
