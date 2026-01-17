// lib/data_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';
import 'config/api_config.dart';

class DataService {
  // Fetch all tickets from the API
  Future<List<Ticket>> loadTickets() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.ticketsUrl));
      
      if (response.statusCode == 200) {
        final List<dynamic> ticketsJson = json.decode(response.body);
        return ticketsJson.map<Ticket>((t) => Ticket.fromApiJson(t)).toList();
      } else {
        throw Exception('Failed to load tickets: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading tickets: $e');
      rethrow;
    }
  }

  // Fetch a single ticket by ID
  Future<Ticket?> loadTicketById(String id) async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.ticketsUrl}/$id'));
      
      if (response.statusCode == 200) {
        final ticketJson = json.decode(response.body);
        return Ticket.fromApiDetailJson(ticketJson);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Failed to load ticket: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading ticket: $e');
      return null;
    }
  }

  // Fetch all customers from the API
  Future<List<Map<String, dynamic>>> loadCustomers() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.customersUrl));
      
      if (response.statusCode == 200) {
        final List<dynamic> customersJson = json.decode(response.body);
        return customersJson.map<Map<String, dynamic>>((c) => c as Map<String, dynamic>).toList();
      } else {
        throw Exception('Failed to load customers: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading customers: $e');
      rethrow;
    }
  }

  // Fetch a single customer by ID
  Future<Customer?> loadCustomerById(String id) async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.customersUrl}/$id'));
      
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        
        // Handle if response is an array with single item
        if (decoded is List && decoded.isNotEmpty) {
          return Customer.fromJson(decoded[0] as Map<String, dynamic>);
        } else if (decoded is Map<String, dynamic>) {
          return Customer.fromJson(decoded);
        } else {
          throw Exception('Unexpected response format: ${decoded.runtimeType}');
        }
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Failed to load customer: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading customer: $e');
      return null;
    }
  }

  // Create a new ticket
  Future<Ticket?> createTicket(Map<String, dynamic> ticketData) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.ticketsUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(ticketData),
      );
      
      if (response.statusCode == 201) {
        final ticketJson = json.decode(response.body);
        return Ticket.fromApiDetailJson(ticketJson);
      } else {
        throw Exception('Failed to create ticket: ${response.statusCode}');
      }
    } catch (e) {
      print('Error creating ticket: $e');
      return null;
    }
  }

  // Update a ticket
  Future<bool> updateTicket(String id, Map<String, dynamic> updates) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.ticketsUrl}/$id'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(updates),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating ticket: $e');
      return false;
    }
  }
}
