import '../../core/api/api_client.dart';
import 'product.dart';

class ProductApi {
  static Future<List<Product>> getProducts() async {
    final data = await ApiClient.get('/products');
    final list = data as List<dynamic>;
    return list.map((item) => Product.fromJson(item)).toList();
  }
}
