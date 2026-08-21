class Category {
  const Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.productsCount = 0,
  });

  final int id;
  final String name;
  final String slug;
  final String? description;
  final int productsCount;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: _toInt(json['id']),
      name: json['name']?.toString() ?? 'Category',
      slug: json['slug']?.toString() ?? '',
      description: json['description']?.toString(),
      productsCount: _toInt(json['products_count']),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
