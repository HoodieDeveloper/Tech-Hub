import '../../../core/api/api_client.dart';
import 'order_history.dart';

class OrderHistoryApi {
  OrderHistoryApi._();

  static Future<List<CustomerOrder>> getOrders() async {
    final dynamic data = await ApiClient.get('/orders');

    final dynamic rawList = data is Map<String, dynamic>
        ? data['orders'] ?? data['data']
        : data;

    if (rawList is! List) {
      throw const ApiException('Orders response is not a list.');
    }

    return rawList
        .whereType<Map>()
        .map((item) => CustomerOrder.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
}
