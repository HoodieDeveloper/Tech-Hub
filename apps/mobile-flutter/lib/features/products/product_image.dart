import 'package:flutter/material.dart';

class ProductImage extends StatelessWidget {
  const ProductImage({
    required this.imageUrl,
    required this.productName,
    super.key,
  });

  final String? imageUrl;
  final String productName;

  @override
  Widget build(BuildContext context) {
    final url = imageUrl?.trim();

    if (url == null || url.isEmpty) {
      return const _ImageFallback(message: 'No image');
    }

    return Image.network(
      url,
      width: double.infinity,
      height: 180,
      fit: BoxFit.cover,
      semanticLabel: productName,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;

        final expectedBytes = loadingProgress.expectedTotalBytes;
        final progress = expectedBytes == null
            ? null
            : loadingProgress.cumulativeBytesLoaded / expectedBytes;

        return SizedBox(
          height: 180,
          child: Center(
            child: CircularProgressIndicator(value: progress),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        return const _ImageFallback(message: 'Image could not load');
      },
    );
  }
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 180,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.broken_image_outlined, size: 40),
          const SizedBox(height: 8),
          Text(message),
        ],
      ),
    );
  }
}
