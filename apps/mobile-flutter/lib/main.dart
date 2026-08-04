import 'package:flutter/material.dart';

import 'features/products/product_list_page.dart';

void main() {
  runApp(const TechHubApp());
}

class TechHubApp extends StatelessWidget {
  const TechHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'TechHub',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0074DF)),
        useMaterial3: true,
      ),
      home: const ProductListPage(),
    );
  }
}
