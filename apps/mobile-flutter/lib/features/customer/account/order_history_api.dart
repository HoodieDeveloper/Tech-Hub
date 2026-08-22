import 'dart:async';

import '../../../core/api/api_client.dart';
import 'order_history.dart';

class OrderHistoryApi {
  OrderHistoryApi._();

  static const Duration _cacheTtl = Duration(minutes: 1);
  static List<CustomerOrder>? _cachedOrders;
  static DateTime? _cachedAt;
  static String? _cachedToken;
  static Future<List<CustomerOrder>>? _inFlightRequest;

  static Future<List<CustomerOrder>> getOrders({
    bool forceRefresh = false,
  }) async {
    _invalidateCacheOnSessionChange();

    if (!forceRefresh && _cachedOrders != null) {
      if (_isCacheFresh) {
        return List<CustomerOrder>.unmodifiable(_cachedOrders!);
      }

      unawaited(_refreshInBackground());
      return List<CustomerOrder>.unmodifiable(_cachedOrders!);
    }

    if (!forceRefresh && _inFlightRequest != null) {
      return _inFlightRequest!;
    }

    final request = _fetchOrdersFromApi();
    _inFlightRequest = request;

    try {
      final orders = await request;
      _cachedOrders = orders;
      _cachedAt = DateTime.now();
      _cachedToken = ApiClient.token;
      return List<CustomerOrder>.unmodifiable(orders);
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

  static void _invalidateCacheOnSessionChange() {
    if (_cachedToken == ApiClient.token) {
      return;
    }

    _cachedOrders = null;
    _cachedAt = null;
    _cachedToken = ApiClient.token;
  }

  static Future<void> _refreshInBackground() async {
    if (_inFlightRequest != null) {
      return;
    }

    final request = _fetchOrdersFromApi();
    _inFlightRequest = request;

    try {
      final orders = await request;
      _cachedOrders = orders;
      _cachedAt = DateTime.now();
      _cachedToken = ApiClient.token;
    } catch (_) {
      // Keep stale cache if refresh fails.
    } finally {
      _inFlightRequest = null;
    }
  }

  static Future<List<CustomerOrder>> _fetchOrdersFromApi() async {
    final dynamic data = await ApiClient.get('/orders');

    final dynamic rawList = data is Map<String, dynamic>
        ? data['orders'] ?? data['data']
        : data;

    if (rawList is! List) {
      throw const ApiException('Orders response is not a list.');
    }

    return rawList
        .whereType<Map>()
        .map((item) => CustomerOrder.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
}
