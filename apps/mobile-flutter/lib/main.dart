import 'package:flutter/material.dart';

import 'features/customer/home/home_screen.dart';

class NoTransitionsBuilder extends PageTransitionsBuilder {
  const NoTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T>? route,
    BuildContext? context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return child;
  }
}

void main() {
  runApp(const TechHubApp());
}

class TechHubApp extends StatelessWidget {
  const TechHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    const background = Color(0xFFF5F7FA);
    const surface = Color(0xFFDEDEDE);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'TechHub',
      theme: ThemeData(
        colorScheme: const ColorScheme(
          brightness: Brightness.light,
          primary: Color(0xFF1F57F7),
          onPrimary: Colors.white,
          primaryContainer: Color(0xFFE4ECFB),
          onPrimaryContainer: Color(0xFF0B1023),
          secondary: Color(0xFF1849B7),
          onSecondary: Colors.white,
          secondaryContainer: Color(0xFFE4ECFB),
          onSecondaryContainer: Color(0xFF0B1023),
          tertiary: Color(0xFF7FA8F7),
          onTertiary: Color(0xFF0B1023),
          tertiaryContainer: Color(0xFFE4ECFB),
          onTertiaryContainer: Color(0xFF0B1023),
          error: Color(0xFFB3261E),
          onError: Colors.white,
          errorContainer: Color(0xFFF9DEDC),
          onErrorContainer: Color(0xFF410E0B),
          surface: surface,
          onSurface: Color(0xFF0B1023),
          surfaceContainerHighest: Color(0xFFF4F6FB),
          onSurfaceVariant: Color(0xFF334155),
          outline: Color(0xFF94A3B8),
          outlineVariant: Color(0xFFD0D7E2),
          shadow: Colors.black,
          scrim: Colors.black,
          inverseSurface: Color(0xFF0B1023),
          onInverseSurface: Colors.white,
          inversePrimary: Color(0xFF7FA8F7),
          surfaceTint: Color(0xFF1F57F7),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: background,
        canvasColor: surface,
        splashColor: const Color(0x331F57F7),
        highlightColor: const Color(0x221F57F7),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFF5F7FA),
          foregroundColor: Color(0xFF0B1023),
          elevation: 0,
          toolbarHeight: 60,
          titleSpacing: 12,
          centerTitle: false,
        ),
        cardTheme: CardThemeData(
          color: surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
        ),
        pageTransitionsTheme: PageTransitionsTheme(
          builders: {
            for (final platform in TargetPlatform.values)
              platform: const NoTransitionsBuilder(),
          },
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF6E9BFF),
          selectedItemColor: Colors.white,
          unselectedItemColor: Color(0xFF1849B7),
          selectedIconTheme: IconThemeData(color: Colors.white),
          unselectedIconTheme: IconThemeData(color: Color(0xFF1849B7)),
          type: BottomNavigationBarType.fixed,
          showUnselectedLabels: true,
        ),
      ),
      home: const CustomerHomeScreen(),
    );
  }
}
