// lib/models.dart
import 'dart:convert';

class Customer {
  final String id;
  final String name;
  final String? phone;
  final String? address;
  final Map<String, dynamic>? coordinates;

  Customer({
    required this.id,
    required this.name,
    this.phone,
    this.address,
    this.coordinates,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        phone: json['phone'],
        address: json['address'],
        coordinates: json['coordinates'] != null ? Map<String, dynamic>.from(json['coordinates']) : null,
      );
}

class Technician {
  final String id;
  final String name;

  Technician({required this.id, required this.name});

  factory Technician.fromJson(Map<String, dynamic> json) => Technician(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
      );
}

class UpdateEntry {
  final DateTime time;
  final String user;
  final String message;

  UpdateEntry({
    required this.time,
    required this.user,
    required this.message,
  });

  factory UpdateEntry.fromJson(Map<String, dynamic> json) => UpdateEntry(
        time: DateTime.parse(json['time']),
        user: json['user'] ?? '',
        message: json['message'] ?? '',
      );
}

class Attachment {
  final String name;
  final String type;

  Attachment({required this.name, required this.type});

  factory Attachment.fromJson(Map<String, dynamic> json) => Attachment(
        name: json['name'] ?? '',
        type: json['type'] ?? 'image',
      );
}

class Ticket {
  final String id;
  final String customerId;
  final String customerNameDisplay;
  final String? phone;
  final String location;
  final Map<String, dynamic>? coordinates;
  final String sla;
  final String complaint;
  final String status;
  final String statusDisplay;
  final String priority;
  final String priorityDisplay;
  final String? technicianId;
  final String technicianDisplay;
  final DateTime? issueTime;
  final DateTime? startTime;
  final DateTime? completionTime;
  final String? rootCause;
  final String? rootCauseDisplay;
  final List<Map<String, dynamic>> materialsUsed;
  final int? totalCost;
  final List<Attachment> attachments;
  final List<UpdateEntry> updates;

  Ticket({
    required this.id,
    required this.customerId,
    required this.customerNameDisplay,
    this.phone,
    required this.location,
    this.coordinates,
    required this.sla,
    required this.complaint,
    required this.status,
    required this.statusDisplay,
    required this.priority,
    required this.priorityDisplay,
    this.technicianId,
    required this.technicianDisplay,
    this.issueTime,
    this.startTime,
    this.completionTime,
    this.rootCause,
    this.rootCauseDisplay,
    required this.materialsUsed,
    this.totalCost,
    required this.attachments,
    required this.updates,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    List attachmentsJson = json['attachments'] ?? [];
    List updatesJson = json['updates'] ?? [];
    return Ticket(
      id: json['id'] ?? '',
      customerId: json['customerId'] ?? '',
      customerNameDisplay: json['customerName_display'] ?? '',
      phone: json['phone'],
      location: json['location'] ?? '',
      coordinates: json['coordinates'] != null ? Map<String, dynamic>.from(json['coordinates']) : null,
      sla: json['sla'] ?? '',
      complaint: json['complaint'] ?? json['issue'] ?? '',
      status: json['status'] ?? '',
      statusDisplay: json['status_display'] ?? '',
      priority: json['priority'] ?? '',
      priorityDisplay: json['priority_display'] ?? '',
      technicianId: json['technicianId'],
      technicianDisplay: json['technician_display'] ?? '',
      issueTime: json['issueTime'] != null ? DateTime.parse(json['issueTime']) : null,
      startTime: json['startTime'] != null ? DateTime.parse(json['startTime']) : null,
      completionTime: json['completionTime'] != null ? DateTime.parse(json['completionTime']) : null,
      rootCause: json['rootCause'],
      rootCauseDisplay: json['rootCause_display'],
      materialsUsed: List<Map<String, dynamic>>.from(json['materialsUsed'] ?? []),
      totalCost: json['totalCost'],
      attachments: attachmentsJson.map((a) => Attachment.fromJson(Map<String, dynamic>.from(a))).toList(),
      updates: updatesJson.map((u) => UpdateEntry.fromJson(Map<String, dynamic>.from(u))).toList(),
    );
  }
}
