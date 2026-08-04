import 'package:flutter/material.dart';

class ProductImage extends StatelessWidget {
  const ProductImage({
    required this.imageUrl,
    required this.productName,
    this.height = 180,
    super.key,
  });

  final String? imageUrl;
  final String productName;
  final double height;

  @override
  Widget build(BuildContext context) {
    final url = imageUrl?.trim();

    if (url == null || url.isEmpty) {
      return _ImageFallback(message: 'No image', height: height);
    }

    return Image.network(
      url,
      width: double.infinity,
      height: height,
      fit: BoxFit.cover,
      semanticLabel: productName,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;

        final expectedBytes = loadingProgress.expectedTotalBytes;
        final progress = expectedBytes == null
            ? null
            : loadingProgress.cumulativeBytesLoaded / expectedBytes;

        return SizedBox(
          height: height,
          child: Center(
            child: CircularProgressIndicator(value: progress),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        return _ImageFallback(message: 'Image could not load', height: height);
      },
    );
  }
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback({required this.message, required this.height});

  final String message;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: height,
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
