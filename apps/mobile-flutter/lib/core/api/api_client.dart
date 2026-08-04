import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient._();

  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static const Duration _timeout = Duration(seconds: 20);

  static String get baseUrl {
    final configuredUrl = _configuredBaseUrl.trim();
    if (configuredUrl.isNotEmpty) {
      return _withoutTrailingSlash(configuredUrl);
    }

    // Railway is the safe default for the mobile app. Pass a different URL
    // with --dart-define when a developer wants to test another API.
    if (kIsWeb) {
      return 'https://tech-hub-production-dd8a.up.railway.app/api';
    }

    return 'https://tech-hub-production-dd8a.up.railway.app/api';
  }

  static String? token;
  static Map<String, dynamic>? currentUser;

  static bool get isLoggedIn => token != null && token!.isNotEmpty;

  static String? get currentRole => currentUser?['role']?.toString();

  static void clearSession() {
    token = null;
    currentUser = null;
  }

  static Map<String, String> get _headers {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    final currentToken = token;
    if (currentToken != null && currentToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer $currentToken';
    }

    return headers;
  }

  static Future<dynamic> get(String path, {bool auth = true}) async {
    try {
      final headers = Map<String, String>.from(_headers);
      if (!auth) headers.remove('Authorization');

      final response = await http
          .get(_buildUri(path), headers: headers)
          .timeout(_timeout);
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Cannot connect to Laravel at $baseUrl. Check the selected API URL.',
      );
    } on FormatException {
      throw const ApiException('The API returned invalid JSON data.');
    } catch (error) {
      if (error is ApiException) rethrow;
      throw ApiException('Network request failed: $error');
    }
  }

  static Future<dynamic> post(
    String path,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    try {
      final headers = Map<String, String>.from(_headers);
      if (!auth) headers.remove('Authorization');

      final response = await http
          .post(
            _buildUri(path),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(_timeout);
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Cannot connect to Laravel at $baseUrl. Check the selected API URL.',
      );
    } on FormatException {
      throw const ApiException('The API returned invalid JSON data.');
    } catch (error) {
      if (error is ApiException) rethrow;
      throw ApiException('Network request failed: $error');
    }
  }

  static Uri _buildUri(String path) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$normalizedPath');
  }

  static dynamic _handleResponse(http.Response response) {
    final dynamic decoded = response.body.isEmpty
        ? null
        : jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    if (response.statusCode == 401) {
      clearSession();
    }

    if (decoded is Map<String, dynamic>) {
      final errors = decoded['errors'];
      if (errors is Map && errors.isNotEmpty) {
        final firstValue = errors.values.first;
        if (firstValue is List && firstValue.isNotEmpty) {
          throw ApiException(firstValue.first.toString());
        }
      }

      final message = decoded['message'];
      if (message != null) {
        throw ApiException(message.toString());
      }
    }

    throw ApiException(
      'Request failed with status ${response.statusCode}.',
    );
  }

  static String _withoutTrailingSlash(String value) {
    return value.endsWith('/') ? value.substring(0, value.length - 1) : value;
  }
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
