import '../../../core/api/api_client.dart';

class PaymentCard {
  final String? id;
  final String cardNumber;
  final String cardholderName;
  final String expiryDate;
  final String cvv;
  final String cardType;
  final String last4;

  PaymentCard({
    this.id,
    required this.cardNumber,
    required this.cardholderName,
    required this.expiryDate,
    required this.cvv,
    required this.cardType,
    required this.last4,
  });

  Map<String, dynamic> toJson() {
    return {
      'card_number': cardNumber,
      'cardholder_name': cardholderName,
      'expiry_date': expiryDate,
      'cvv': cvv,
      'card_type': cardType,
      'last4': last4,
    };
  }

  factory PaymentCard.fromJson(Map<String, dynamic> json) {
    return PaymentCard(
      id: json['id']?.toString(),
      cardNumber: json['card_number'] ?? '',
      cardholderName: json['cardholder_name'] ?? '',
      expiryDate:
          json['expiry_date'] ??
          (json['expiry_month'] != null && json['expiry_year'] != null
              ? '${json['expiry_month']}/${json['expiry_year']}'
              : ''),
      cvv: json['cvv'] ?? '',
      cardType: json['card_type'] ?? json['brand'] ?? 'Demo Card',
      last4: json['last4'] ?? json['last_four'] ?? '0000',
    );
  }
}

class PaymentService {
  static void setToken(String token) {
    ApiClient.token = token;
  }

  static Future<List<PaymentCard>> getUserCards() async {
    try {
      if (!ApiClient.isLoggedIn) {
        throw Exception('User not authenticated');
      }

      final data = await ApiClient.get('/user/cards');
      final cards = data is Map ? data['data'] : data;
      if (cards is! List) return [];
      return cards
          .whereType<Map>()
          .map((card) => PaymentCard.fromJson(Map<String, dynamic>.from(card)))
          .toList();
    } catch (e) {
      throw Exception('Error fetching cards: $e');
    }
  }

  static Future<PaymentCard> saveCard(PaymentCard card) async {
    try {
      if (!ApiClient.isLoggedIn) {
        throw Exception('User not authenticated');
      }

      final response = await ApiClient.post(
        '/payments/saved-card',
        card.toJson(),
      );
      final data = response is Map
          ? response['saved_card'] ?? response['data'] ?? response
          : response;
      if (data is! Map) throw Exception('Invalid card response');
      return PaymentCard.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      throw Exception('Error saving card: $e');
    }
  }

  static Future<PaymentCard?> getSavedCard() async {
    if (!ApiClient.isLoggedIn) return null;

    final response = await ApiClient.get('/payments/saved-card');
    if (response is! Map || response['saved_card'] is! Map) return null;
    return PaymentCard.fromJson(
      Map<String, dynamic>.from(response['saved_card'] as Map),
    );
  }

  static Future<void> deleteCard(String cardId) async {
    try {
      if (!ApiClient.isLoggedIn) {
        throw Exception('User not authenticated');
      }

      await ApiClient.delete('/user/cards/$cardId');
    } catch (e) {
      throw Exception('Error deleting card: $e');
    }
  }

  static String getCardType(String cardNumber) {
    final number = cardNumber.replaceAll(' ', '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'unknown';
  }

  static String getLast4(String cardNumber) {
    final number = cardNumber.replaceAll(' ', '');
    if (number.length >= 4) {
      return number.substring(number.length - 4);
    }
    return number;
  }

  static bool isValidCardNumber(String cardNumber) {
    final number = cardNumber.replaceAll(' ', '');
    return RegExp(r'^\d{16}$').hasMatch(number);
  }

  static bool isValidExpiryDate(String expiryDate) {
    return expiryDate.isNotEmpty;
  }

  static bool isValidCVV(String cvv) {
    return cvv.length >= 3 && cvv.length <= 4 && int.tryParse(cvv) != null;
  }
}
