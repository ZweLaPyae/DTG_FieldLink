// lib/data_service.dart
import 'dart:convert';
import 'package:flutter/services.dart';
import 'models.dart';

class DataService {
  final String jsonPath;

  DataService({required this.jsonPath});

  Future<List<Ticket>> loadTickets() async {
    final raw = await rootBundle.loadString(jsonPath);
    final Map<String, dynamic> doc = json.decode(raw);
    final List ticketsJson = doc['tickets'] ?? [];
    return ticketsJson.map<Ticket>((t) => Ticket.fromJson(Map<String, dynamic>.from(t))).toList();
  }

  Future<Ticket?> loadTicketById(String id) async {
    final tickets = await loadTickets();
    try {
      return tickets.firstWhere((t) => t.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> loadCustomers() async {
    final raw = await rootBundle.loadString(jsonPath);
    final Map<String, dynamic> doc = json.decode(raw);
    final List customersJson = doc['customers'] ?? [];
    return customersJson.map<Map<String, dynamic>>((c) => Map<String, dynamic>.from(c)).toList();
  }

  Future<Customer?> loadCustomerById(String id) async {
    final raw = await rootBundle.loadString(jsonPath);
    final Map<String, dynamic> doc = json.decode(raw);
    final List customersJson = doc['customers'] ?? [];
    try {
      final customerJson = customersJson.firstWhere((c) => c['id'] == id);
      return Customer.fromJson(Map<String, dynamic>.from(customerJson));
    } catch (_) {
      return null;
    }
  }
}
