import '../../core/api/api_client.dart';
import 'product.dart';

class ProductApi {
  ProductApi._();

  static Future<List<Product>> getProducts() async {
    final dynamic data = await ApiClient.get('/products', auth: false);

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

  static Future<Product> getProduct(int id) async {
    final dynamic data = await ApiClient.get('/products/$id');

    if (data is! Map) {
      throw const ApiException('Product response is invalid.');
    }

    return Product.fromJson(Map<String, dynamic>.from(data));
  }
}
