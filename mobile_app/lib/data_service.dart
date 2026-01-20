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
        print('Loaded ${ticketsJson.length} tickets from API');
        
        // Log first ticket for debugging
        if (ticketsJson.isNotEmpty) {
          print('Sample ticket data: ${ticketsJson.first}');
        }
        
        final tickets = ticketsJson.map<Ticket>((t) => Ticket.fromApiJson(t)).toList();
        
        // Log parsed tickets
        for (var ticket in tickets) {
          print('Parsed ticket ${ticket.id}: status=${ticket.status}, technicianId=${ticket.technicianId}');
        }
        
        return tickets;
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
      print('Updating ticket $id with data: $updates');
      final response = await http.put(
        Uri.parse('${ApiConfig.ticketsUrl}/$id'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(updates),
      );
      
      print('Update response status: ${response.statusCode}');
      print('Update response body: ${response.body}');
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating ticket: $e');
      return false;
    }
  }

  // Check if technician exists by email (for login)
  Future<Technician?> checkTechnicianByEmail(String email) async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.techniciansUrl));
      
      if (response.statusCode == 200) {
        final List<dynamic> techniciansJson = json.decode(response.body);
        
        // Find technician with matching email
        final technicianData = techniciansJson.firstWhere(
          (tech) => tech['email']?.toString().toLowerCase() == email.toLowerCase(),
          orElse: () => null,
        );
        
        if (technicianData != null) {
          return Technician.fromJson(technicianData as Map<String, dynamic>);
        }
        return null;
      } else {
        throw Exception('Failed to load technicians: ${response.statusCode}');
      }
    } catch (e) {
      print('Error checking technician email: $e');
      return null;
    }
  }

  // Get technician by ID
  Future<Technician?> getTechnicianById(String id) async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.techniciansUrl}/$id'));
      
      if (response.statusCode == 200) {
        final technicianJson = json.decode(response.body);
        return Technician.fromJson(technicianJson);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Failed to load technician: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading technician: $e');
      return null;
    }
  }

  // Load root causes
  Future<List<Map<String, dynamic>>> loadRootCauses() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/rootcauses'));
      
      if (response.statusCode == 200) {
        final List<dynamic> rootCausesJson = json.decode(response.body);
        return rootCausesJson.map<Map<String, dynamic>>((rc) => rc as Map<String, dynamic>).toList();
      } else {
        throw Exception('Failed to load root causes: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading root causes: $e');
      rethrow;
    }
  }

  // Load material catalog
  Future<List<Map<String, dynamic>>> loadMaterialCatalog() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/materials'));
      
      if (response.statusCode == 200) {
        final List<dynamic> materialsJson = json.decode(response.body);
        return materialsJson.map<Map<String, dynamic>>((m) => m as Map<String, dynamic>).toList();
      } else {
        throw Exception('Failed to load materials: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading materials: $e');
      rethrow;
    }
  }
}
