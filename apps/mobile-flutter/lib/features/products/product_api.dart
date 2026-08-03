import '../../core/api/api_client.dart';
import 'product.dart';

class ProductApi {
  ProductApi._();

  static Future<List<Product>> getProducts() async {
    final dynamic data = await ApiClient.get('/products');

    // Supports the current Laravel response: [ {...}, {...} ]
    // and a future Laravel Resource response: { "data": [ ... ] }.
    final dynamic rawList = data is Map<String, dynamic> ? data['data'] : data;

    if (rawList is! List) {
      throw const ApiException('Products response is not a list.');
    }

    return rawList
        .whereType<Map>()
        .map(
          (item) => Product.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }
}
