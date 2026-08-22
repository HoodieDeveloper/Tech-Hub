import 'dart:async';

import '../../../core/api/api_client.dart';

class CustomerWishlist {
  CustomerWishlist._();

  static final CustomerWishlist instance = CustomerWishlist._();

  final Set<int> _productIds = <int>{};
  final Map<int, bool> _desiredStates = <int, bool>{};
  final Set<int> _syncInProgress = <int>{};

  Set<int> get productIds => Set<int>.unmodifiable(_productIds);

  bool contains(int productId) => _productIds.contains(productId);

  Future<void> load({bool suppressErrors = true}) async {
    if (!ApiClient.isLoggedIn) {
      _productIds.clear();
      return;
    }

    try {
      final ids = await WishlistApi.getWishlistIds();
      _productIds
        ..clear()
        ..addAll(ids);
    } catch (_) {
      if (!suppressErrors) {
        rethrow;
      }
    }
  }

  Future<void> refresh() => load();

  Future<void> toggle(int productId) async {
    if (!ApiClient.isLoggedIn) {
      return;
    }

    final shouldBeSaved = !_productIds.contains(productId);
    _setLocalState(productId, shouldBeSaved);
    _desiredStates[productId] = shouldBeSaved;

    if (_syncInProgress.add(productId)) {
      unawaited(_syncProductState(productId));
    }
  }

  Future<void> _syncProductState(int productId) async {
    while (true) {
      final desired = _desiredStates[productId];
      if (desired == null) {
        _syncInProgress.remove(productId);
        return;
      }

      try {
        if (desired) {
          await WishlistApi.addProduct(productId);
        } else {
          await WishlistApi.removeProduct(productId);
        }

        if (_desiredStates[productId] == desired) {
          _desiredStates.remove(productId);
          _syncInProgress.remove(productId);
          return;
        }
      } catch (_) {
        _desiredStates.remove(productId);
        _syncInProgress.remove(productId);
        _setLocalState(productId, !desired);
        return;
      }
    }
  }

  void _setLocalState(int productId, bool isSaved) {
    if (isSaved) {
      _productIds.add(productId);
    } else {
      _productIds.remove(productId);
    }
  }

  Future<void> removePurchasedProducts(Iterable<int> productIds) async {
    if (!ApiClient.isLoggedIn) {
      return;
    }

    for (final productId in productIds.toSet()) {
      try {
        await WishlistApi.removeProduct(productId);
        _productIds.remove(productId);
      } catch (_) {}
    }
  }

  void clear() => _productIds.clear();
}

class WishlistApi {
  WishlistApi._();

  static List<int> parseWishlistIds(dynamic data) {
    final rawItems = data is Map
        ? data['data'] ?? data['items'] ?? data['wishlist'] ?? const <dynamic>[]
        : data;
    final list = rawItems is List ? rawItems : const <dynamic>[];
    final ids = <int>{};

    for (final item in list) {
      if (item is int) {
        ids.add(item);
        continue;
      }

      if (item is String) {
        final parsedId = int.tryParse(item);
        if (parsedId != null) {
          ids.add(parsedId);
        }
        continue;
      }

      if (item is Map) {
        final productCandidates = <dynamic>[
          item['product_id'],
          item['productId'],
          item['product'] is Map ? item['product']['id'] : null,
          item['product'] is Map ? item['product']['product_id'] : null,
        ];
        final fallbackCandidates = <dynamic>[item['id'], item['wishlist_id']];

        for (final candidate in [...productCandidates, ...fallbackCandidates]) {
          final parsedId = candidate == null
              ? null
              : int.tryParse(candidate.toString());
          if (parsedId != null) {
            ids.add(parsedId);
            break;
          }
        }
      }
    }

    return ids.toList()..sort();
  }

  static Future<List<int>> getWishlistIds() async {
    final dynamic data = await ApiClient.get('/wishlist');
    return parseWishlistIds(data);
  }

  static Future<void> addProduct(int productId) async {
    try {
      await ApiClient.post('/wishlist/$productId', {});
      return;
    } catch (_) {
      await ApiClient.post('/wishlist', {'product_id': productId});
    }
  }

  static Future<void> removeProduct(int productId) async {
    try {
      await ApiClient.delete('/wishlist/$productId');
      return;
    } catch (_) {
      await ApiClient.post('/wishlist/remove', {'product_id': productId});
    }
  }
}
