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
          print('Sample ticket teamId from API: ${ticketsJson.first['teamId']}');
        }
        
        final tickets = ticketsJson.map<Ticket>((t) => Ticket.fromApiJson(t)).toList();
        
        // Log parsed tickets
        for (var ticket in tickets) {
          print('Parsed ticket ${ticket.id}: status=${ticket.status}, technicianId=${ticket.technicianId}, teamId=${ticket.teamId}');
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

  // Delete a single attachment from a ticket
  Future<bool> deleteAttachment({
    required String ticketId,
    required String attachmentUrl,
    String requesterType = 'technician',
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.ticketsUrl}/$ticketId/attachments'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'attachment': attachmentUrl,
          'requesterType': requesterType,
        }),
      );

      print('Delete attachment status: ${response.statusCode}');
      if (response.statusCode == 200) return true;

      print('Delete attachment failed: ${response.body}');
      return false;
    } catch (e) {
      print('Error deleting attachment: $e');
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

  // Fetch splitterMap for a ticket by ID
  Future<String?> fetchSplitterMap(String ticketId) async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.ticketsUrl}/$ticketId/splitter-map'));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return data['splitterMap'] as String?;
      } else if (response.statusCode == 404) {
        print('Splitter map not found for ticket $ticketId');
        return null;
      } else {
        throw Exception('Failed to fetch splitter map: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching splitter map: $e');
      return null;
    }
  }

  // Fetch all technicians from the API
  Future<List<Technician>> loadTechnicians() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.techniciansUrl));

      if (response.statusCode == 200) {
        final List<dynamic> techniciansJson = json.decode(response.body);
        print('Loaded ${techniciansJson.length} technicians from API');

        final technicians = techniciansJson
            .map<Technician>((t) => Technician.fromJson(t as Map<String, dynamic>))
            .toList();

        // Log parsed technicians for debugging
        for (var tech in technicians) {
          print('Technician ${tech.id}: ${tech.name} <${tech.email}>');
        }

        return technicians;
      } else {
        throw Exception('Failed to load technicians: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading technicians: $e');
      rethrow;
    }
  }

  // Get technician by ID (accepts both String and int)
  Future<Technician?> getTechnicianById(dynamic id) async {
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

  // Load all teams
  Future<List<Map<String, dynamic>>> loadTeams() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/teams'));
      
      if (response.statusCode == 200) {
        final List<dynamic> teamsJson = json.decode(response.body);
        return teamsJson.map<Map<String, dynamic>>((t) => t as Map<String, dynamic>).toList();
      } else {
        throw Exception('Failed to load teams: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading teams: $e');
      rethrow;
    }
  }

  // Get all teams for a technician (since one technician can be in multiple teams)
  Future<List<Map<String, dynamic>>> getTeamsForTechnician(int technicianId) async {
    try {
      final teams = await loadTeams();
      final technicianTeams = <Map<String, dynamic>>[];
      
      // Check if technician is a team leader
      for (var team in teams) {
        if (team['leaderId'] == technicianId) {
          technicianTeams.add({
            ...team,
            'role': 'Leader',
          });
        }
      }
      
      // Check if technician is a team member
      for (var team in teams) {
        final memberIds = team['memberIds'];
        if (memberIds is List && memberIds.contains(technicianId)) {
          // Check if not already added as leader
          final alreadyAdded = technicianTeams.any((t) => t['id'] == team['id']);
          if (!alreadyAdded) {
            technicianTeams.add({
              ...team,
              'role': 'Member',
            });
          }
        }
      }
      
      print('Found ${technicianTeams.length} teams for technician $technicianId');
      return technicianTeams;
    } catch (e) {
      print('Error getting teams for technician: $e');
      return [];
    }
  }

  // DEPRECATED: Use getTeamsForTechnician instead
  // Get team by technician ID (returns first team found)
  Future<Map<String, dynamic>?> getTeamForTechnician(int technicianId) async {
    try {
      final teams = await getTeamsForTechnician(technicianId);
      return teams.isNotEmpty ? teams.first : null;
    } catch (e) {
      print('Error getting team for technician: $e');
      return null;
    }
  }

  // Update technician profile
  Future<bool> updateTechnician(int technicianId, Map<String, dynamic> updates) async {
    try {
      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/technicians/$technicianId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(updates),
      );
      
      if (response.statusCode == 200) {
        print('Technician updated successfully');
        return true;
      } else {
        throw Exception('Failed to update technician: ${response.statusCode}');
      }
    } catch (e) {
      print('Error updating technician: $e');
      rethrow;
    }
  }

  // Update technician password
  Future<bool> updateTechnicianPassword(int technicianId, String currentPassword, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/technicians/$technicianId/change-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );
      
      if (response.statusCode == 200) {
        print('Password updated successfully');
        return true;
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to update password');
      }
    } catch (e) {
      print('Error updating password: $e');
      rethrow;
    }
  }

  // Fetch notifications for a technician
  Future<Map<String, dynamic>> loadNotifications(int technicianId, {int limit = 20, bool unreadOnly = false}) async {
    try {
      final url = '${ApiConfig.baseUrl}/notifications/technician/$technicianId?limit=$limit&unreadOnly=$unreadOnly';
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('Loaded ${data['notifications'].length} notifications');
        return data; // Returns { notifications: [...], unreadCount: X }
      } else {
        throw Exception('Failed to load notifications: ${response.statusCode}');
      }
    } catch (e) {
      print('Error loading notifications: $e');
      rethrow;
    }
  }

  // Mark notification(s) as read
  Future<bool> markNotificationsAsRead({List<int>? notificationIds, int? userId, String? userType, bool markAll = false}) async {
    try {
      final url = '${ApiConfig.baseUrl}/notifications/mark-read';
      final body = markAll && userId != null && userType != null
          ? {'userId': userId, 'userType': userType, 'markAll': true}
          : {'notificationIds': notificationIds};
      
      final response = await http.put(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );
      
      if (response.statusCode == 200) {
        print('Notifications marked as read');
        return true;
      } else {
        throw Exception('Failed to mark notifications as read');
      }
    } catch (e) {
      print('Error marking notifications as read: $e');
      rethrow;
    }
  }

  // Delete notification(s)
  Future<bool> deleteNotifications({List<int>? notificationIds, int? userId, String? userType, bool deleteAll = false}) async {
    try {
      final url = '${ApiConfig.baseUrl}/notifications';
      final body = deleteAll && userId != null && userType != null
          ? {'userId': userId, 'userType': userType, 'deleteAll': true}
          : {'notificationIds': notificationIds};
      
      final response = await http.delete(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );
      
      if (response.statusCode == 200) {
        print('Notifications deleted');
        return true;
      } else {
        throw Exception('Failed to delete notifications');
      }
    } catch (e) {
      print('Error deleting notifications: $e');
      rethrow;
    }
  }

  // Fetch GeoJSON content from a given URL
  Future<String> fetchGeoJsonContent(String url) async {
    try {
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        return response.body;
      } else {
        throw Exception('Failed to fetch GeoJSON content: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching GeoJSON content: $e');
      rethrow;
    }
  }
}

