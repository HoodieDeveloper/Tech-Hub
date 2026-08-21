import 'package:flutter/material.dart';

import '../../../../../core/theme.dart';
import '../../../products/product.dart';
import '../../../products/product_image.dart';

class CustomerProductCard extends StatelessWidget {
  const CustomerProductCard({
    required this.product,
    required this.isFavorite,
    required this.onTap,
    required this.onToggleFavorite,
    this.showCategoryLabel = false,
    this.imageHeight = 225,
    this.borderColor = AppColors.border,
    super.key,
  });

  final Product product;
  final bool isFavorite;
  final VoidCallback onTap;
  final VoidCallback onToggleFavorite;
  final bool showCategoryLabel;
  final double imageHeight;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    final categoryLabel = _categoryLabelFor(product);

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFEAF2FF),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  height: imageHeight,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(18),
                    ),
                  ),
                  child: ProductImage(
                    imageUrl: product.imageUrl,
                    productName: product.name,
                    height: imageHeight,
                  ),
                ),
                Flexible(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(10, 8, 10, 12),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final compact = constraints.maxHeight < 90;

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (showCategoryLabel) ...[
                              Text(
                                categoryLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              SizedBox(height: compact ? 2 : 4),
                            ],
                            Text(
                              product.name,
                              maxLines: compact ? 1 : 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: compact ? 12 : 14,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0B1023),
                              ),
                            ),
                            SizedBox(height: compact ? 4 : 6),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                '\$${product.price.toStringAsFixed(2)}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: compact ? 14 : 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Material(
                color: Colors.white.withValues(alpha: 0.86),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onToggleFavorite,
                  child: Padding(
                    padding: const EdgeInsets.all(7),
                    child: Icon(
                      isFavorite
                          ? Icons.favorite
                          : Icons.favorite_border_rounded,
                      color: isFavorite ? Colors.red : AppColors.primary,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _categoryLabelFor(Product product) {
  final fromName = product.categoryName?.trim();
  if (fromName != null && fromName.isNotEmpty) {
    return fromName;
  }

  final fromSlug = product.categorySlug?.trim();
  if (fromSlug != null && fromSlug.isNotEmpty) {
    final normalized = fromSlug.replaceAll('-', ' ').replaceAll('_', ' ');
    final words = normalized
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .toList();

    if (words.isNotEmpty) {
      return words
          .map(
            (word) =>
                '${word.substring(0, 1).toUpperCase()}${word.substring(1).toLowerCase()}',
          )
          .join(' ');
    }
  }

  return 'General';
}
