// lib/models.dart

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

  factory Customer.fromJson(Map<String, dynamic> json) {
    // Handle phone field - API returns array, we need string
    String? phoneStr;
    if (json['phone'] != null) {
      if (json['phone'] is List) {
        final List<dynamic> phoneList = json['phone'] as List;
        phoneStr = phoneList.isNotEmpty ? phoneList.join(', ') : null;
      } else {
        phoneStr = json['phone'].toString();
      }
    }
    
    return Customer(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      phone: phoneStr,
      address: json['address'],
      coordinates: json['coordinates'] != null ? Map<String, dynamic>.from(json['coordinates']) : null,
    );
  }
}

class Technician {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String picture;
  final int? ticketCount;

  Technician({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.picture,
    this.ticketCount,
  });

  factory Technician.fromJson(Map<String, dynamic> json) => Technician(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        phone: json['phone'] ?? '',
        picture: json['picture'] ?? '',
        ticketCount: json['_count']?['tickets'],
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
  final String? technicianNote;
  final List<Map<String, dynamic>> materialsUsed;
  final double? totalCost;
  final List<Attachment> attachments;
  final List<UpdateEntry> updates;
  final String? wayToFix;
  final List<Map<String, dynamic>> breakTimes;

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
    this.technicianNote,
    required this.materialsUsed,
    this.totalCost,
    required this.attachments,
    required this.updates,
    this.wayToFix,
    this.breakTimes = const [],
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
      rootCause: json['rootCauseDetails'],
      rootCauseDisplay: json['rootCause_display'],
      technicianNote: json['technicianNote'],
      materialsUsed: List<Map<String, dynamic>>.from(json['materialsUsed'] ?? []),
      totalCost: json['totalCost']?.toDouble(),
      attachments: attachmentsJson.map((a) => Attachment.fromJson(Map<String, dynamic>.from(a))).toList(),
      updates: updatesJson.map((u) => UpdateEntry.fromJson(Map<String, dynamic>.from(u))).toList(),
      wayToFix: json['wayToFix'],
      breakTimes: json['breakTimes'] != null ? List<Map<String, dynamic>>.from(json['breakTimes']) : [],
    );
  }

  // Factory for API list response (GET /tickets)
  factory Ticket.fromApiJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'] ?? '',
      customerId: '', // Not provided in list response
      customerNameDisplay: json['customerName'] ?? '',
      phone: json['phone'] != null ? (json['phone'] is List ? (json['phone'] as List).join(', ') : json['phone'].toString()) : null,
      location: '', // Not in list response
      coordinates: null,
      sla: json['sla'] ?? '',
      complaint: json['complaint'] ?? '',
      status: json['status'] ?? '',
      statusDisplay: json['status'] ?? '',
      priority: json['priorityId'] ?? '',
      priorityDisplay: json['priority'] ?? json['priorityId'] ?? '',
      technicianId: json['technicianId']?.toString(),
      technicianDisplay: json['technician_display'] ?? '',
      issueTime: json['issueTime'] != null ? DateTime.parse(json['issueTime']) : null,
      startTime: json['startTime'] != null ? DateTime.parse(json['startTime']) : null,
      completionTime: json['completionTime'] != null ? DateTime.parse(json['completionTime']) : null,
      rootCause: null,
      rootCauseDisplay: null,
      technicianNote: null,
      materialsUsed: [],
      totalCost: null,
      attachments: [],
      updates: [],
      wayToFix: null,
      breakTimes: [],
    );
  }

  // Factory for API detail response (GET /tickets/:id)
  factory Ticket.fromApiDetailJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'] ?? '',
      customerId: json['customerId'] ?? '',
      customerNameDisplay: json['customer']?['name'] ?? '',
      phone: json['customer']?['phone'] != null 
        ? (json['customer']['phone'] is List 
          ? (json['customer']['phone'] as List).join(', ') 
          : json['customer']['phone'].toString()) 
        : null,
      location: json['customer']?['address'] ?? '',
      coordinates: null,
      sla: json['sla'] ?? '',
      complaint: json['complaint'] ?? '',
      status: json['status'] ?? '',
      statusDisplay: json['status'] ?? '',
      priority: json['priorityId'] ?? '',
      priorityDisplay: json['priority']?['display'] ?? json['priorityId'] ?? '',
      technicianId: json['technicianId']?.toString(),
      technicianDisplay: json['technician']?['name'] ?? '',
      issueTime: json['issueTime'] != null ? DateTime.parse(json['issueTime']) : null,
      startTime: json['startTime'] != null ? DateTime.parse(json['startTime']) : null,
      completionTime: json['completionTime'] != null ? DateTime.parse(json['completionTime']) : null,
      rootCause: json['rootCauseDetails'],
      rootCauseDisplay: json['rootCause']?['name'],
      technicianNote: json['technicianNote'],
      materialsUsed: json['materialsUsed'] != null 
          ? List<Map<String, dynamic>>.from(json['materialsUsed'])
          : [],
      totalCost: json['totalCost']?.toDouble(),
      attachments: [],
      updates: [],
      wayToFix: json['wayToFix'],
      breakTimes: json['breakTimes'] != null ? List<Map<String, dynamic>>.from(json['breakTimes']) : [],
    );
  }

  Ticket copyWith({
    String? customerNameDisplay,
    String? phone,
  }) {
    return Ticket(
      id: id,
      customerId: customerId,
      customerNameDisplay: customerNameDisplay ?? this.customerNameDisplay,
      phone: phone ?? this.phone,
      location: location,
      coordinates: coordinates,
      sla: sla,
      complaint: complaint,
      status: status,
      statusDisplay: statusDisplay,
      priority: priority,
      priorityDisplay: priorityDisplay,
      technicianId: technicianId,
      technicianDisplay: technicianDisplay,
      issueTime: issueTime,
      startTime: startTime,
      completionTime: completionTime,
      rootCause: rootCause,
      rootCauseDisplay: rootCauseDisplay,
      technicianNote: technicianNote,
      materialsUsed: materialsUsed,
      totalCost: totalCost,
      attachments: attachments,
      updates: updates,
      wayToFix: wayToFix,
      breakTimes: breakTimes,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'customerName_display': customerNameDisplay,
      'phone': phone,
      'location': location,
      'coordinates': coordinates,
      'sla': sla,
      'complaint': complaint,
      'status': status,
      'status_display': statusDisplay,
      'priority': priority,
      'priority_display': priorityDisplay,
      'technicianId': technicianId,
      'technician_display': technicianDisplay,
      'issueTime': issueTime?.toIso8601String(),
      'startTime': startTime?.toIso8601String(),
      'completionTime': completionTime?.toIso8601String(),
      'rootCause': rootCause,
      'rootCause_display': rootCauseDisplay,
      'materialsUsed': materialsUsed,
      'totalCost': totalCost,
      'attachments': attachments.map((a) => {'name': a.name, 'type': a.type}).toList(),
      'updates': updates.map((u) => {'time': u.time.toIso8601String(), 'user': u.user, 'message': u.message}).toList(),
      'wayToFix': wayToFix,
    };
  }
}
