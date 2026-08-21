import 'package:flutter/material.dart';

Future<void> handleFavoriteToggle({
  required BuildContext context,
  required bool isLoggedIn,
  required int productId,
  required Future<void> Function(int productId) toggleFavorite,
  required VoidCallback onUpdated,
  required WidgetBuilder loginPageBuilder,
}) async {
  if (!isLoggedIn) {
    if (!context.mounted) {
      return;
    }

    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: loginPageBuilder));
    return;
  }

  await toggleFavorite(productId);

  if (!context.mounted) {
    return;
  }

  onUpdated();
}
