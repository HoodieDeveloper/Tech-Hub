class Product {
  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.stock,
    this.description,
    this.imageUrl,
  });

  final int id;
  final String name;
  final String? description;
  final double price;
  final int stock;
  final String? imageUrl;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: _toInt(json['id']),
      name: json['name']?.toString() ?? 'Unnamed product',
      description: _toNullableString(json['description']),
      price: _toDouble(json['price']),
      stock: _toInt(json['stock']),
      imageUrl: _toNullableString(json['image_url']),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
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
