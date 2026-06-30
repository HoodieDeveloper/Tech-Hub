import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  // Android emulator uses 10.0.2.2 to reach your computer localhost.
  // For real phone, replace with your laptop IP, example: http://192.168.1.8:8000/api
  static const String baseUrl = 'http://10.0.2.2:8000/api';

  static String? token;

  static Map<String, String> get _headers {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  static Future<dynamic> get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    return _handleResponse(response);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static dynamic _handleResponse(http.Response response) {
    final decoded = response.body.isEmpty ? null : jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final message = decoded is Map && decoded['message'] != null
        ? decoded['message'].toString()
        : 'Request failed';
    throw Exception(message);
  }
}
