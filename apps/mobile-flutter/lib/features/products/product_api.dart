import 'dart:async';

import '../../core/api/api_client.dart';
import 'product.dart';

class ProductApi {
  ProductApi._();

  static const Duration _cacheTtl = Duration(minutes: 2);
  static List<Product>? _cachedProducts;
  static DateTime? _cachedAt;
  static Future<List<Product>>? _inFlightRequest;

  static Future<List<Product>> getProducts({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedProducts != null) {
      if (_isCacheFresh) {
        return List<Product>.unmodifiable(_cachedProducts!);
      }

      unawaited(_refreshInBackground());
      return List<Product>.unmodifiable(_cachedProducts!);
    }

    if (!forceRefresh && _inFlightRequest != null) {
      return _inFlightRequest!;
    }

    final request = _fetchProductsFromApi();
    _inFlightRequest = request;

    try {
      final products = await request;
      _cachedProducts = products;
      _cachedAt = DateTime.now();
      return List<Product>.unmodifiable(products);
    } finally {
      _inFlightRequest = null;
    }
  }

  static bool get _isCacheFresh {
    final cachedAt = _cachedAt;
    if (cachedAt == null) {
      return false;
    }

    return DateTime.now().difference(cachedAt) <= _cacheTtl;
  }

  static Future<void> _refreshInBackground() async {
    if (_inFlightRequest != null) {
      return;
    }

    final request = _fetchProductsFromApi();
    _inFlightRequest = request;

    try {
      final products = await request;
      _cachedProducts = products;
      _cachedAt = DateTime.now();
    } catch (_) {
      // Keep stale cache if refresh fails.
    } finally {
      _inFlightRequest = null;
    }
  }

  static Future<List<Product>> _fetchProductsFromApi() async {
    final dynamic data = await ApiClient.get('/products', auth: false);

    final dynamic rawList = data is Map<String, dynamic> ? data['data'] : data;

    if (rawList is! List) {
      throw const ApiException('Products response is not a list.');
    }

    return rawList
        .whereType<Map>()
        .map((item) => Product.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  static Future<Product> getProduct(int id) async {
    final dynamic data = await ApiClient.get('/products/$id');

    if (data is! Map) {
      throw const ApiException('Product response is invalid.');
    }

    return Product.fromJson(Map<String, dynamic>.from(data));
  }
}
