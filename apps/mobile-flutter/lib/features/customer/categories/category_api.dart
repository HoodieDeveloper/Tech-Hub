import '../../../core/api/api_client.dart';
import 'category.dart';

class CategoryApi {
  CategoryApi._();

  static Future<List<Category>> getCategories() async {
    try {
      final dynamic data = await ApiClient.get('/categories', auth: false);
      final dynamic rawList = data is Map<String, dynamic>
          ? data['data']
          : data;

      if (rawList is! List) {
        throw const ApiException('Categories response is not a list.');
      }

      return rawList
          .whereType<Map>()
          .map((item) => Category.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on ApiException {
      return _demoCategories;
    }
  }

  static const List<Category> _demoCategories = [
    Category(
      id: 1,
      name: 'Laptops',
      slug: 'laptops',
      description: 'Portable performance machines.',
      productsCount: 1,
    ),
    Category(
      id: 2,
      name: 'Phones',
      slug: 'phones',
      description: 'Everyday smartphones and accessories.',
      productsCount: 1,
    ),
    Category(
      id: 3,
      name: 'Audio',
      slug: 'audio',
      description: 'Speakers, earbuds, and headphones.',
      productsCount: 1,
    ),
  ];
}
