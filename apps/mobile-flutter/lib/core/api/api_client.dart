import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient._();

  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static const Duration _timeout = Duration(seconds: 15);

  static String get baseUrl {
    final configuredUrl = _configuredBaseUrl.trim();
    if (configuredUrl.isNotEmpty) {
      return _withoutTrailingSlash(configuredUrl);
    }

    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }

    // Android Emulator reaches the host computer through 10.0.2.2.
    // For a physical phone, pass your computer's LAN IP with --dart-define.
    return 'http://10.0.2.2:8000/api';
  }

  static String? token;

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

  static Future<dynamic> get(String path) async {
    try {
      final response = await http
          .get(_buildUri(path), headers: _headers)
          .timeout(_timeout);
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Cannot connect to Laravel at $baseUrl. Check that the API is running.',
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
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http
          .post(
            _buildUri(path),
            headers: _headers,
            body: jsonEncode(body),
          )
          .timeout(_timeout);
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Cannot connect to Laravel at $baseUrl. Check that the API is running.',
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
