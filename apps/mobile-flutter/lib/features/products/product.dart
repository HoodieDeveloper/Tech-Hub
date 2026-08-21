class Product {
  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.stock,
    this.description,
    this.imageUrl,
    this.categoryId,
    this.categoryName,
    this.categorySlug,
    this.originalPrice,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.imageUrls,
    this.specs,
    this.inStock,
  });

  final int id;
  final String name;
  final String? description;
  final double price;
  final double? originalPrice;
  final int stock;
  final String? imageUrl;
  final int? categoryId;
  final String? categoryName;
  final String? categorySlug;
  final double rating;
  final int reviewCount;
  final List<String>? imageUrls;
  final Map<String, String>? specs;
  final bool? inStock;

  factory Product.fromJson(Map<String, dynamic> json) {
    final parsedStock = _toInt(json['stock']);
    final category = json['category'];
    final categoryMap = category is Map
        ? Map<String, dynamic>.from(category)
        : null;
    final categoryText = category is String ? category.trim() : null;

    // Parse image URLs
    final List<String>? imageUrls;
    final dynamic images = json['images'];
    if (images is List) {
      imageUrls = images
          .map((e) => e is Map ? e['url']?.toString() : e?.toString())
          .whereType<String>()
          .toList();
    } else {
      imageUrls = null;
    }

    // Parse specs
    final Map<String, String>? specs;
    final dynamic specsData = json['specs'];
    if (specsData is Map) {
      specs = Map<String, String>.from(
        specsData.map((k, v) => MapEntry(k.toString(), v.toString())),
      );
    } else {
      specs = null;
    }

    return Product(
      id: _toInt(json['id']),
      name: json['name']?.toString() ?? 'Unnamed product',
      description: _toNullableString(json['description']),
      price: _toDouble(json['price']),
      originalPrice: json['original_price'] != null
          ? _toDouble(json['original_price'])
          : null,
      stock: parsedStock,
      imageUrl: _toNullableString(json['image_url']),
      categoryId: _toIntNullable(json['category_id'] ?? categoryMap?['id']),
      categoryName: _toNullableString(
        categoryMap?['name'] ?? json['category_name'] ?? categoryText,
      ),
      categorySlug: _toNullableString(
        categoryMap?['slug'] ?? json['category_slug'],
      ),
      rating: _toDouble(json['rating'] ?? 0.0),
      reviewCount: _toInt(json['review_count'] ?? 0),
      imageUrls: imageUrls,
      specs: specs,
      inStock: json['in_stock'] as bool? ?? parsedStock > 0,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static int? _toIntNullable(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  static String? _toNullableString(dynamic value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }
}
