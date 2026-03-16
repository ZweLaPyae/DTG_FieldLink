// lib/ticket_detail.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models.dart';
import '../data_service.dart';
import '../config/design_tokens.dart';
import '../widgets/primary_button.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import 'dart:io';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:math';
import 'package:image_picker/image_picker.dart';
import '../providers/tickets_provider.dart';
import '../services/spaces_upload_service.dart';
import '../services/notification_service.dart';

/// Helper function to convert DateTime to Myanmar timezone (UTC+6:30)
DateTime toMyanmarTime(DateTime utcTime) {
  // Myanmar timezone is UTC+6:30
  return utcTime.toUtc().add(const Duration(hours: 6, minutes: 30));
}

LatLngBounds boundsFromPoints(List<LatLng> points) {
  final lats = points.map((p) => p.latitude);
  final lngs = points.map((p) => p.longitude);

  return LatLngBounds(
    southwest: LatLng(lats.reduce(min), lngs.reduce(min)),
    northeast: LatLng(lats.reduce(max), lngs.reduce(max)),
  );
}

class TicketDetailPage extends ConsumerStatefulWidget {
  final String ticketId;
  final bool isFromTasksTab;
  const TicketDetailPage({
    super.key,
    required this.ticketId,
    this.isFromTasksTab = false,
  });

  @override
  ConsumerState<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends ConsumerState<TicketDetailPage> {
  final DataService dataService = DataService();
  late Future<Ticket?> _ticketFuture;
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _wayToFixController = TextEditingController();
  final TextEditingController _rootCauseDetailsController =
      TextEditingController();
  Set<Polyline> _polylines = {};
  LatLng _initialCenter = const LatLng(13.7563, 100.5018); // fallback
  bool _mapReady = false;
  final Set<Marker> _markers = {};
  bool _isOnBreak = false; // Track break time status
  DateTime? _currentBreakStartTime; // Track when current break started
  String? _currentBreakReason; // Track reason for current break
  int _rebuildKey = 0; // Force FutureBuilder rebuild
  bool _isEditingRootCause = false;
  bool _isEditingNotes = false;
  bool _hasChanges = false;
  String? _selectedRootCauseId;
  List<Map<String, dynamic>> _materialsUsed = [];
  List<Map<String, dynamic>> _rootCauseOptions = [];
  List<Map<String, dynamic>> _materialCatalog = [];
  bool _isLoadingRootCauses = true;
  bool _isLoadingMaterials = true;
  
  // Store callback reference so we can remove it in dispose
  late final Function() _notificationCallback;

  // Check if ticket is editable (from tasks tab or assigned)
  bool get _isEditable => widget.isFromTasksTab;

  // Check if can edit based on ticket status
  bool _canEditRootCause(Ticket? ticket) {
    if (!_isEditable || ticket == null) return false;
    final status = ticket.status.toUpperCase();
    // Can only edit root cause when IN_PROGRESS
    return status == 'IN_PROGRESS';
  }

  Future<void> _deleteAttachment(Ticket ticket, String attachmentUrl) async {
    if (!_canUploadMedia(ticket)) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete attachment?'),
        content: const Text('This will remove the attachment from the ticket.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed != true) return;

    final success = await dataService.deleteAttachment(
      ticketId: ticket.id,
      attachmentUrl: attachmentUrl,
      requesterType: 'technician',
    );

    if (success && mounted) {
      setState(() {
        _ticketFuture = _reloadTicket();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Attachment deleted')),
      );
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete attachment')),
        );
      }
    }
  }

  bool _canEditNotes(Ticket? ticket) {
    if (!_isEditable || ticket == null) return false;
    final status = ticket.status.toUpperCase();
    // Can edit notes when IN_PROGRESS or IN_REVIEW
    return status == 'IN_PROGRESS' || status == 'IN_REVIEW';
  }

  bool _canManageBreaks(Ticket? ticket) {
    if (!_isEditable || ticket == null) return false;
    final status = ticket.status.toUpperCase();
    // Can only manage breaks when IN_PROGRESS
    return status == 'IN_PROGRESS';
  }

  bool _canUploadMedia(Ticket? ticket) {
    if (!_isEditable || ticket == null) return false;
    final status = ticket.status.toUpperCase();
    // Can only upload photos and videos when IN_PROGRESS
    return status == 'IN_PROGRESS';
  }

  // Helper function to reload ticket with all data
  Future<Ticket?> _reloadTicket() async {
    print('_reloadTicket: Starting ticket reload for ${widget.ticketId}');
    final ticket = await dataService.loadTicketById(widget.ticketId);
    print(
      '_reloadTicket: Loaded ticket with ${ticket?.breakTimes.length ?? 0} break times',
    );
    print('📎 Attachments count: ${ticket?.attachments.length ?? 0}');
    if (ticket != null && ticket.attachments.isNotEmpty) {
      print('📎 Attachments:');
      for (var att in ticket.attachments) {
        print('  - ${att.type}: ${att.name}');
      }
    }

    if (ticket != null) {
      final customer = await dataService.loadCustomerById(ticket.customerId);
      print('_reloadTicket: Loaded customer ${customer?.name}');

      if (ticket.materialsUsed.isNotEmpty) {
        _materialsUsed = List<Map<String, dynamic>>.from(ticket.materialsUsed);
      }
      _notesController.text = ticket.technicianNote ?? '';
      _wayToFixController.text = ticket.wayToFix ?? '';
      _rootCauseDetailsController.text = ticket.rootCause ?? '';

      final finalTicket = ticket.copyWith(
        customerNameDisplay: customer?.name ?? ticket.customerNameDisplay,
        phone: customer?.phone,
      );

      print(
        '_reloadTicket: Returning ticket with ${finalTicket.breakTimes.length} break times',
      );
      return finalTicket;
    }
    print('_reloadTicket: Ticket was null');
    return null;
  }

  Future<String?> _showBreakReasonDialog() async {
    final TextEditingController reasonController = TextEditingController();
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Break Reason'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(
            hintText: 'Enter reason for break',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(null),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (reasonController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please enter a reason'),
                    duration: Duration(seconds: 2),
                  ),
                );
                return;
              }
              Navigator.of(context).pop(reasonController.text.trim());
            },
            child: const Text('Start Break'),
          ),
        ],
      ),
    );
  }

  void _addMarkerFromGeoJson(List coordinates, String title) {
    _markers.add(
      Marker(
        markerId: MarkerId(title),
        position: LatLng(coordinates[1], coordinates[0]),
        infoWindow: InfoWindow(title: title),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueRed, // 📍 PIN COLOR
        ),
      ),
    );
  }

  Future<void> _loadGeoJson() async {
    try {
      // Fetch the splitterMap link from the backend
      final response = await dataService.fetchSplitterMap(widget.ticketId);
      if (response == null || response.isEmpty) {
        throw Exception('Splitter map link not found');
      }

      // Fetch the GeoJSON file content
      final geoJsonData = await dataService.fetchGeoJsonContent(response);
      final Map<String, dynamic> geojson = json.decode(geoJsonData);

      final Set<Polyline> polylines = {};

      for (final feature in geojson['features']) {
        final geometry = feature['geometry'];
        final type = geometry['type'];
        final coords = geometry['coordinates'];
        final props = feature['properties'] ?? {};

        // ───────── LINESTRING (route) ─────────
        if (type == 'LineString') {
          final points = coords.map<LatLng>((c) {
            return LatLng(c[1], c[0]); // [lng, lat]
          }).toList();

          polylines.add(
            Polyline(
              polylineId: PolylineId(
                feature['id']?.toString() ?? UniqueKey().toString(),
              ),
              points: points,
              width: 4,
              color: Colors.red,
            ),
          );

          if (points.isNotEmpty) {
            _initialCenter = points.first;
          }
        }

        // ───────── POINT (marker) ─────────
        if (type == 'Point') {
          _addMarkerFromGeoJson(coords, props['name'] ?? 'Destination');
        }
      }

      setState(() {
        _polylines = polylines;
        _mapReady = true;
      });
    } catch (e) {
      print('Error loading GeoJSON: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _loadGeoJson();
    _loadRootCauses();
    _loadMaterialCatalog();
    _ticketFuture = _reloadTicket();
    
    // Create callback reference
    _notificationCallback = () {
      print('🔔 Notification received in TicketDetail, refreshing ticket...');
      if (mounted) {
        setState(() {
          _rebuildKey++;
          _ticketFuture = _reloadTicket();
        });
      }
    };
    
    // Register callback to auto-refresh ticket when notification arrives
    addNotificationListener(_notificationCallback);
  }

  Future<void> _loadRootCauses() async {
    try {
      final response = await dataService.loadRootCauses();
      setState(() {
        _rootCauseOptions = response;
        _isLoadingRootCauses = false;
      });
    } catch (e) {
      print('Error loading root causes: $e');
      setState(() {
        _isLoadingRootCauses = false;
      });
    }
  }

  Future<void> _loadMaterialCatalog() async {
    try {
      final response = await dataService.loadMaterialCatalog();
      setState(() {
        _materialCatalog = response;
        _isLoadingMaterials = false;
      });
    } catch (e) {
      print('Error loading material catalog: $e');
      setState(() {
        _isLoadingMaterials = false;
      });
    }
  }

  @override
  void dispose() {
    removeNotificationListener(_notificationCallback);
    _notesController.dispose();
    _wayToFixController.dispose();
    _rootCauseDetailsController.dispose();
    super.dispose();
  }

  Color _priorityColor(String p) {
    final lower = p.toLowerCase();
    if (lower.contains('urgent')) return const Color(0xFFDC2626);
    return const Color(0xFF6B7280);
  }

  IconData _priorityIcon(String p) {
    final lower = p.toLowerCase();
    if (lower.contains('urgent')) return Icons.warning_amber_rounded;
    return Icons.info_outline;
  }

  Color _getStatusColor(String status) {
    final lower = status.toLowerCase();
    if (lower.contains('in-progress')) return const Color(0xFF3B82F6);
    if (lower.contains('completed')) return const Color(0xFF10B981);
    return const Color(0xFFFBBF24); // Pending
  }

  IconData _getStatusIcon(String status) {
    final lower = status.toLowerCase();
    if (lower.contains('in-progress')) return Icons.loop;
    if (lower.contains('completed')) return Icons.check_circle;
    return Icons.pending_actions; // Pending
  }

  double _calculateTotalCost() {
    double total = 0;
    for (var material in _materialsUsed) {
      total += (material['cost'] ?? 0).toDouble();
    }
    return total;
  }

  void _showAddMaterialDialog(BuildContext context) {
    int? selectedMaterialId;
    Map<String, dynamic>? selectedMaterial;
    final quantityController = TextEditingController();
    final startPointController = TextEditingController();
    final endPointController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) {
          return AlertDialog(
            title: const Text('Add Material'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonFormField<int>(
                    initialValue: selectedMaterialId,
                    decoration: InputDecoration(
                      labelText: 'Select Material',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: _materialCatalog.map((material) {
                      return DropdownMenuItem<int>(
                        value: material['id'] as int,
                        child: Text(material['name'].toString()),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setDialogState(() {
                        selectedMaterialId = value;
                        selectedMaterial = _materialCatalog.firstWhere(
                          (m) => m['id'] == value,
                        );
                        quantityController.clear();
                        startPointController.clear();
                        endPointController.clear();
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  if (selectedMaterial != null) ...[
                    if (selectedMaterial!['unit'] == 'PIECE') ...[
                      TextField(
                        controller: quantityController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Quantity',
                          hintText: 'Enter quantity',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Unit Cost: MMK${selectedMaterial!['unitCost']} per piece',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                    ] else if (selectedMaterial!['unit'] == 'METER') ...[
                      TextField(
                        controller: startPointController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Start Point (m)',
                          hintText: 'Enter start point',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: endPointController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'End Point (m)',
                          hintText: 'Enter end point',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Unit Cost: MMK${selectedMaterial!['unitCost']} per ${selectedMaterial!['referenceLength']}m',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              PrimaryButton(
                text: 'Add Material',
                variant: ButtonVariant.primary,
                onPressed: () {
                  if (selectedMaterial == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please select a material')),
                    );
                    return;
                  }

                  double cost = 0;
                  int quantity = 0;

                  if (selectedMaterial!['unit'] == 'PIECE') {
                    if (quantityController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter quantity')),
                      );
                      return;
                    }
                    quantity = int.tryParse(quantityController.text) ?? 0;
                    cost =
                        quantity *
                        (selectedMaterial!['unitCost'] as num).toDouble();
                  } else if (selectedMaterial!['unit'] == 'METER') {
                    if (startPointController.text.isEmpty ||
                        endPointController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please enter start and end points'),
                        ),
                      );
                      return;
                    }
                    final startPoint =
                        double.tryParse(startPointController.text) ?? 0;
                    final endPoint =
                        double.tryParse(endPointController.text) ?? 0;
                    final distance = (endPoint - startPoint).abs();
                    final referenceLength =
                        (selectedMaterial!['referenceLength'] as num?)
                            ?.toDouble() ??
                        1;
                    final unitCost = (selectedMaterial!['unitCost'] as num)
                        .toDouble();
                    cost = (distance / referenceLength) * unitCost;
                    quantity = distance
                        .round(); // Store distance rounded to nearest meter
                  }

                  setState(() {
                    _materialsUsed.add({
                      'materialId': selectedMaterialId,
                      'quantity': quantity,
                      'cost': cost,
                    });
                    _hasChanges = true;
                  });

                  Navigator.pop(dialogContext);
                },
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    print('build: Building with rebuild key = $_rebuildKey');
    return FutureBuilder<Ticket?>(
      key: ValueKey(_rebuildKey), // Force rebuild when key changes
      future: _ticketFuture,
      builder: (context, snapshot) {
        print(
          'FutureBuilder: connectionState = ${snapshot.connectionState}, hasData = ${snapshot.hasData}',
        );
        if (snapshot.hasData) {
          print(
            'FutureBuilder: Ticket has ${snapshot.data?.breakTimes.length ?? 0} break times',
          );
        }

        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final ticket = snapshot.data;
        if (ticket == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Ticket not found')),
            body: const Center(child: Text('Ticket not found')),
          );
        }

        print(
          'FutureBuilder: Rendering ticket with ${ticket.breakTimes.length} break times',
        );

        return Scaffold(
          backgroundColor: DesignTokens.backgroundColor,
          appBar: AppBar(
            title: Text(
              'Ticket ${ticket.id}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            flexibleSpace: Container(
              decoration: BoxDecoration(gradient: DesignTokens.primaryGradient),
            ),
            backgroundColor: Colors.transparent,
            leading: BackButton(onPressed: () => Navigator.pop(context)),
            actions: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _getStatusColor(ticket.status).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getStatusIcon(ticket.status),
                      color: _getStatusColor(ticket.status),
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      ticket.statusDisplay,
                      style: TextStyle(
                        color: _getStatusColor(ticket.status),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _priorityColor(ticket.priority),
                      _priorityColor(ticket.priority).withOpacity(0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: _priorityColor(ticket.priority).withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _priorityIcon(ticket.priority),
                      color: Colors.white,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      ticket.priorityDisplay,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: Padding(
            padding: const EdgeInsets.all(14),
            child: ListView(
              children: [
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Customer',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Text(
                          ticket.customerNameDisplay,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Phone Number',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Text(
                          ticket.phone ?? 'N/A',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Splitter Map',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 180,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: !_mapReady
                            ? const Center(child: CircularProgressIndicator())
                            : GoogleMap(
                                initialCameraPosition: CameraPosition(
                                  target: _initialCenter,
                                  zoom: 15,
                                ),
                                polylines: _polylines,
                                markers: _markers,
                                zoomControlsEnabled: true,
                                mapToolbarEnabled: true,
                              ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Issue',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Text(
                          ticket.complaint,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Assigned Team',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Text(
                          ticket.teamDisplay.isEmpty
                              ? 'Not Assigned Yet'
                              : ticket.teamDisplay,
                          style: TextStyle(
                            fontSize: 14,
                            color: ticket.teamDisplay.isEmpty
                                ? Colors.grey[600]
                                : Colors.black,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Diagnosis & Solution',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                          if (_canEditRootCause(ticket))
                            IconButton(
                              icon: Icon(
                                _isEditingRootCause ? Icons.close : Icons.edit,
                                color: _isEditingRootCause
                                    ? Colors.red
                                    : const Color(0xFF3B82F6),
                              ),
                              onPressed: () {
                                setState(() {
                                  _isEditingRootCause = !_isEditingRootCause;
                                  if (!_isEditingRootCause) {
                                    // Reset to original values if canceling
                                    _wayToFixController.text =
                                        ticket.wayToFix ?? '';
                                    _rootCauseDetailsController.text = '';
                                    _selectedRootCauseId = null;
                                  } else {
                                    // Initialize with current values
                                    _wayToFixController.text =
                                        ticket.wayToFix ?? '';
                                    _rootCauseDetailsController.text =
                                        ticket.rootCause ?? '';
                                    // Find the ID from the name
                                    if (ticket.rootCauseDisplay != null &&
                                        _rootCauseOptions.isNotEmpty) {
                                      final match = _rootCauseOptions
                                          .firstWhere(
                                            (rc) =>
                                                rc['name'] ==
                                                ticket.rootCauseDisplay,
                                            orElse: () => {},
                                          );
                                      _selectedRootCauseId = match['id']
                                          ?.toString();
                                    }
                                  }
                                });
                              },
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Root Cause',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (_isEditingRootCause)
                        _isLoadingRootCauses
                            ? const Center(child: CircularProgressIndicator())
                            : DropdownButtonFormField<String>(
                                initialValue: _selectedRootCauseId,
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: Color(0xFF3B82F6),
                                    ),
                                  ),
                                ),
                                hint: const Text('Select root cause'),
                                items: _rootCauseOptions.map((option) {
                                  return DropdownMenuItem<String>(
                                    value: option['id'].toString(),
                                    child: Text(option['name'].toString()),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  setState(() {
                                    _selectedRootCauseId = value;
                                    _hasChanges = true;
                                  });
                                },
                              )
                      else
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Text(
                            ticket.rootCauseDisplay ?? 'N/A',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                      const SizedBox(height: 12),
                      const Text(
                        'Root Cause Details',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (_isEditingRootCause)
                        TextField(
                          controller: _rootCauseDetailsController,
                          maxLines: 2,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Color(0xFF3B82F6),
                              ),
                            ),
                            hintText: 'Enter detailed root cause information',
                          ),
                          onChanged: (value) {
                            setState(() {
                              _hasChanges = true;
                            });
                          },
                        )
                      else
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Text(
                            ticket.rootCause ?? 'N/A',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                      const SizedBox(height: 12),
                      const Text(
                        'Solution',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (_isEditingRootCause)
                        TextField(
                          controller: _wayToFixController,
                          maxLines: 3,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Color(0xFF3B82F6),
                              ),
                            ),
                            hintText: 'Describe the solution or fix applied',
                          ),
                          onChanged: (value) {
                            setState(() {
                              _hasChanges = true;
                            });
                          },
                        )
                      else
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Text(
                            ticket.wayToFix ?? 'N/A',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Materials Used',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          if (_isEditingRootCause)
                            TextButton.icon(
                              onPressed: _isLoadingMaterials
                                  ? null
                                  : () {
                                      _showAddMaterialDialog(context);
                                    },
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Add More'),
                              style: TextButton.styleFrom(
                                foregroundColor: const Color(0xFF3B82F6),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      if (_isEditingRootCause && _materialsUsed.isNotEmpty)
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              // Table header
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                    topRight: Radius.circular(8),
                                  ),
                                ),
                                child: Row(
                                  children: const [
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        'Material',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        'Unit',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        'Cost',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                    SizedBox(width: 40),
                                  ],
                                ),
                              ),
                              // Table rows
                              ..._materialsUsed.asMap().entries.map((entry) {
                                final index = entry.key;
                                final m = entry.value;
                                final material = _materialCatalog.firstWhere(
                                  (mat) => mat['id'] == m['materialId'],
                                  orElse: () => {
                                    'name': 'Unknown',
                                    'unit': 'PIECE',
                                  },
                                );
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color: Colors.grey.shade200,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: Text(
                                          '${material['name']}',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          '${m['quantity']} ${material['unit']?.toString().toLowerCase() ?? 'unit'}',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          'MMK${m['cost']?.toStringAsFixed(2) ?? '0.00'}',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: Color(0xFF10B981),
                                          ),
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(
                                          Icons.delete,
                                          color: Colors.red,
                                          size: 18,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _materialsUsed.removeAt(index);
                                            _hasChanges = true;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        )
                      else if (!_isEditingRootCause &&
                          ticket.materialsUsed.isNotEmpty)
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              // Table header
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                    topRight: Radius.circular(8),
                                  ),
                                ),
                                child: Row(
                                  children: const [
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        'Material',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        'Unit',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        'Cost',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Table rows
                              ...ticket.materialsUsed.map((m) {
                                final material = _materialCatalog.firstWhere(
                                  (mat) => mat['id'] == m['materialId'],
                                  orElse: () => {
                                    'name': 'Material #${m['materialId']}',
                                    'unit': 'PIECE',
                                  },
                                );
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color: Colors.grey.shade200,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: Text(
                                          '${material['name']}',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          '${m['quantity']} ${material['unit']?.toString().toLowerCase() ?? 'unit'}',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          'MMK${m['cost']?.toStringAsFixed(2) ?? '0.00'}',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: Color(0xFF10B981),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        )
                      else
                        const Text(
                          'No materials used',
                          style: TextStyle(color: Colors.grey),
                        ),
                      const SizedBox(height: 12),
                      const Text(
                        'Total Cost',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'MMK${_isEditingRootCause ? _calculateTotalCost().toStringAsFixed(2) : (ticket.totalCost ?? 0).toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Fault Media section - only show for assigned tickets (from tasks tab)
                if (_isEditable) ...[
                  _sectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            Text(
                              'Fault Media',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Upload buttons for photos and videos
                        Row(
                          children: [
                            Expanded(
                              child: PrimaryButton(
                                text: 'Add Photos',
                                icon: Icons.add_photo_alternate,
                                variant: ButtonVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                onPressed: !_canUploadMedia(ticket) ? null : () async {
                                  try {
                                    final picker = ImagePicker();
                                    final pickedFiles = await picker
                                        .pickMultiImage();

                                    if (pickedFiles.isEmpty) return;

                                    if (mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Uploading ${pickedFiles.length} photo(s)...',
                                          ),
                                        ),
                                      );
                                    }

                                    final spacesService = SpacesUploadService();
                                    final uploadedUrls = <String>[];

                                    for (var pickedFile in pickedFiles) {
                                      final file = File(pickedFile.path);
                                      final cdnUrl = await spacesService
                                          .uploadPhoto(file, ticket.id);
                                      uploadedUrls.add(cdnUrl);
                                    }

                                    // Update ticket attachments
                                    // attachments in DB is JSON: {"photos": [urls], "videos": [urls]}
                                    // But ticket.attachments is List<Attachment> from parsing
                                    // We need to send raw JSON to backend
                                    final List<Map<String, String>>
                                    currentAttachments = uploadedUrls
                                        .map(
                                          (url) => {
                                            'name': url,
                                            'type': 'image',
                                          },
                                        )
                                        .toList();

                                    // Merge with existing attachments
                                    final allAttachments = [
                                      ...ticket.attachments.map(
                                        (a) => {'name': a.name, 'type': a.type},
                                      ),
                                      ...currentAttachments,
                                    ];

                                    print(
                                      '📤 Updating ticket with ${allAttachments.length} total attachments',
                                    );
                                    print(
                                      '📤 New photos: ${uploadedUrls.length}',
                                    );

                                    await dataService.updateTicket(ticket.id, {
                                      'attachments': allAttachments,
                                    });

                                    print('✅ Ticket updated, reloading...');

                                    if (mounted) {
                                      setState(() {
                                        _ticketFuture = _reloadTicket();
                                      });
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            '${uploadedUrls.length} photo(s) uploaded successfully',
                                          ),
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    if (mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Error uploading photos: $e',
                                          ),
                                        ),
                                      );
                                    }
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: PrimaryButton(
                                text: 'Add Videos',
                                icon: Icons.videocam,
                                variant: ButtonVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                onPressed: !_canUploadMedia(ticket) ? null : () async {
                                  try {
                                    final picker = ImagePicker();
                                    final pickedFile = await picker.pickVideo(
                                      source: ImageSource.gallery,
                                    );

                                    if (pickedFile == null) return;

                                    if (mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text('Uploading video...'),
                                        ),
                                      );
                                    }

                                    final spacesService = SpacesUploadService();
                                    final file = File(pickedFile.path);
                                    final cdnUrl = await spacesService
                                        .uploadVideo(file, ticket.id);

                                    // Update ticket attachments
                                    final newAttachment = {
                                      'name': cdnUrl,
                                      'type': 'video',
                                    };

                                    // Merge with existing attachments
                                    final allAttachments = [
                                      ...ticket.attachments.map(
                                        (a) => {'name': a.name, 'type': a.type},
                                      ),
                                      newAttachment,
                                    ];

                                    print(
                                      '📹 Updating ticket with video attachment',
                                    );
                                    print(
                                      '📹 Total attachments: ${allAttachments.length}',
                                    );

                                    await dataService.updateTicket(ticket.id, {
                                      'attachments': allAttachments,
                                    });

                                    print(
                                      '✅ Ticket updated with video, reloading...',
                                    );

                                    if (mounted) {
                                      setState(() {
                                        _ticketFuture = _reloadTicket();
                                      });
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Video uploaded successfully',
                                          ),
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    if (mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Error uploading video: $e',
                                          ),
                                        ),
                                      );
                                    }
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Display uploaded attachments
                        if (ticket.attachments.isEmpty)
                          const Text(
                            'No media uploaded yet',
                            style: TextStyle(color: Colors.grey, fontSize: 14),
                          )
                        else
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ticket.attachments.map((attachment) {
                              final isImage = attachment.type == 'image';
                              return Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  color: Colors.grey.shade200,
                                ),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: isImage
                                          ? Image.network(
                                              attachment.name,
                                              fit: BoxFit.cover,
                                              errorBuilder:
                                                  (context, error, stackTrace) {
                                                    return Column(
                                                      mainAxisAlignment:
                                                          MainAxisAlignment
                                                              .center,
                                                      children: const [
                                                        Icon(
                                                          Icons.broken_image,
                                                          color: Colors.grey,
                                                        ),
                                                        SizedBox(height: 4),
                                                        Text(
                                                          'Failed',
                                                          style: TextStyle(
                                                            fontSize: 10,
                                                          ),
                                                        ),
                                                      ],
                                                    );
                                                  },
                                              loadingBuilder:
                                                  (
                                                    context,
                                                    child,
                                                    loadingProgress,
                                                  ) {
                                                    if (loadingProgress ==
                                                        null) {
                                                      return child;
                                                    }
                                                    return const Center(
                                                      child:
                                                          CircularProgressIndicator(
                                                            strokeWidth: 2,
                                                          ),
                                                    );
                                                  },
                                            )
                                          : Column(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: const [
                                                Icon(
                                                  Icons.videocam,
                                                  size: 32,
                                                  color: Colors.grey,
                                                ),
                                                SizedBox(height: 4),
                                                Text(
                                                  'Video',
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                  ),
                                                ),
                                              ],
                                            ),
                                    ),
                                    // Tap to view full size
                                    Material(
                                      color: Colors.transparent,
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(8),
                                        onTap: () {
                                          if (isImage) {
                                            // Open full screen image viewer
                                            showDialog(
                                              context: context,
                                              builder: (context) => Dialog(
                                                backgroundColor: Colors.transparent,
                                                insetPadding: const EdgeInsets.all(8),
                                                child: Stack(
                                                  children: [
                                                    // Full screen image with zoom
                                                    InteractiveViewer(
                                                      minScale: 0.5,
                                                      maxScale: 4.0,
                                                      child: Center(
                                                        child: Image.network(
                                                          attachment.name,
                                                          fit: BoxFit.contain,
                                                          errorBuilder: (context, error, stackTrace) {
                                                            return Container(
                                                              padding: const EdgeInsets.all(20),
                                                              color: Colors.black54,
                                                              child: const Column(
                                                                mainAxisSize: MainAxisSize.min,
                                                                children: [
                                                                  Icon(Icons.broken_image, color: Colors.white, size: 48),
                                                                  SizedBox(height: 8),
                                                                  Text('Failed to load image', style: TextStyle(color: Colors.white)),
                                                                ],
                                                              ),
                                                            );
                                                          },
                                                          loadingBuilder: (context, child, loadingProgress) {
                                                            if (loadingProgress == null) return child;
                                                            return const Center(
                                                              child: CircularProgressIndicator(color: Colors.white),
                                                            );
                                                          },
                                                        ),
                                                      ),
                                                    ),
                                                    // Close button
                                                    Positioned(
                                                      top: 8,
                                                      right: 8,
                                                      child: IconButton(
                                                        onPressed: () => Navigator.of(context).pop(),
                                                        icon: Container(
                                                          padding: const EdgeInsets.all(8),
                                                          decoration: BoxDecoration(
                                                            color: Colors.black54,
                                                            borderRadius: BorderRadius.circular(20),
                                                          ),
                                                          child: const Icon(Icons.close, color: Colors.white),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            );
                                          } else {
                                            // For videos, show a message (video player could be added later)
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(content: Text('Video playback coming soon')),
                                            );
                                          }
                                        },
                                      ),
                                    ),
                                    if (_canUploadMedia(ticket))
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: InkWell(
                                          onTap: () => _deleteAttachment(ticket, attachment.name),
                                          borderRadius: BorderRadius.circular(999),
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFDC2626), // red delete affordance
                                              borderRadius: BorderRadius.circular(999),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black.withOpacity(0.2),
                                                  blurRadius: 4,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            child: const Icon(
                                              Icons.delete,
                                              size: 16,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Technician Notes',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                          if (_canEditNotes(ticket))
                            IconButton(
                              icon: Icon(
                                _isEditingNotes ? Icons.close : Icons.edit,
                                color: _isEditingNotes
                                    ? Colors.red
                                    : const Color(0xFF3B82F6),
                              ),
                              onPressed: () {
                                setState(() {
                                  _isEditingNotes = !_isEditingNotes;
                                });
                              },
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: 100,
                          maxHeight: 200,
                        ),
                        child: SingleChildScrollView(
                          child: TextField(
                            controller: _notesController,
                            maxLines: null,
                            minLines: 4,
                            enabled: _canEditNotes(ticket) && _isEditingNotes,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: (_canEditNotes(ticket) && _isEditingNotes)
                                  ? Colors.white
                                  : Colors.grey.shade100,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: (_canEditNotes(ticket) && _isEditingNotes)
                                      ? const Color(0xFF3B82F6)
                                      : Colors.grey.shade300,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: (_canEditNotes(ticket) && _isEditingNotes)
                                      ? const Color(0xFF3B82F6)
                                      : Colors.grey.shade300,
                                ),
                              ),
                              hintText: _canEditNotes(ticket)
                                  ? 'Add your notes here...'
                                  : 'No notes yet',
                            ),
                            onChanged: (value) {
                              setState(() {
                                _hasChanges = true;
                              });
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Save Update button - only visible when editable and has changes
                if (_isEditable && _hasChanges)
                  PrimaryButton(
                    text: 'Save Update',
                    variant: ButtonVariant.secondary,
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    onPressed: () async {
                      // Save ticket updates
                      final updates = <String, dynamic>{};

                      if (_isEditingRootCause) {
                        if (_selectedRootCauseId != null) {
                          updates['rootCauseId'] = _selectedRootCauseId;
                        }
                        if (_rootCauseDetailsController.text.isNotEmpty) {
                          updates['rootCauseDetails'] =
                              _rootCauseDetailsController.text;
                        }
                        if (_wayToFixController.text.isNotEmpty) {
                          updates['wayToFix'] = _wayToFixController.text;
                        }
                        if (_materialsUsed.isNotEmpty) {
                          updates['materialsUsed'] = _materialsUsed;
                          // Calculate total cost
                          double totalCost = 0;
                          for (var material in _materialsUsed) {
                            totalCost += (material['cost'] ?? 0).toDouble();
                          }
                          updates['totalCost'] = totalCost;
                        }
                      }

                      if (_notesController.text.isNotEmpty) {
                        updates['technicianNote'] = _notesController.text;
                      }

                      try {
                        await dataService.updateTicket(ticket.id, updates);
                        // Refresh tickets provider
                        ref
                            .read(ticketsProvider.notifier)
                            .loadTickets(forceRefresh: true);
                        setState(() {
                          _hasChanges = false;
                          _isEditingRootCause = false;
                          _isEditingNotes = false;
                        });
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Ticket updated successfully'),
                            ),
                          );
                          // Reload ticket data with controller reinitialization
                          setState(() {
                            _ticketFuture = dataService
                                .loadTicketById(widget.ticketId)
                                .then((ticket) async {
                                  if (ticket != null) {
                                    final customer = await dataService
                                        .loadCustomerById(ticket.customerId);
                                    if (ticket.materialsUsed.isNotEmpty) {
                                      _materialsUsed =
                                          List<Map<String, dynamic>>.from(
                                            ticket.materialsUsed,
                                          );
                                    }
                                    // Reinitialize controllers with fresh data
                                    _notesController.text =
                                        ticket.technicianNote ?? '';
                                    _wayToFixController.text =
                                        ticket.wayToFix ?? '';
                                    _rootCauseDetailsController.text =
                                        ticket.rootCause ?? '';

                                    return ticket.copyWith(
                                      customerNameDisplay:
                                          customer?.name ??
                                          ticket.customerNameDisplay,
                                      phone: customer?.phone,
                                    );
                                  }
                                  return ticket;
                                });
                          });
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error updating ticket: $e'),
                            ),
                          );
                        }
                      }
                    },
                  ),
                if (_isEditable && _hasChanges) const SizedBox(height: 12),
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Activity',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          if (_canManageBreaks(ticket))
                            Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  size: 16,
                                  color: Colors.grey[600],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _isOnBreak
                                      ? "Press to END Break"
                                      : "Press to START Break",
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Material(
                                  color: _isOnBreak
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFF59E0B),
                                  borderRadius: BorderRadius.circular(8),
                                  child: InkWell(
                                    onTap: () async {
                                      final now = DateTime.now();

                                      if (_isOnBreak) {
                                        // End break - save to database
                                        if (_currentBreakStartTime != null) {
                                          // Get the latest ticket data first
                                          final latestTicket = await dataService
                                              .loadTicketById(widget.ticketId);
                                          if (latestTicket == null) {
                                            if (mounted) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                const SnackBar(
                                                  content: Text(
                                                    'Error: Could not load ticket data',
                                                  ),
                                                ),
                                              );
                                            }
                                            return;
                                          }

                                          print('=== ENDING BREAK ===');
                                          print(
                                            'Latest ticket breakTimes count: ${latestTicket.breakTimes.length}',
                                          );
                                          print(
                                            'Latest ticket breakTimes: ${latestTicket.breakTimes}',
                                          );

                                          final updatedBreakTimes =
                                              List<Map<String, dynamic>>.from(
                                                latestTicket.breakTimes,
                                              );
                                          updatedBreakTimes.add({
                                            'reason': _currentBreakReason ?? '',
                                            'start': _currentBreakStartTime!
                                                .toIso8601String(),
                                            'end': now.toIso8601String(),
                                          });

                                          print(
                                            'Updated break times count: ${updatedBreakTimes.length}',
                                          );
                                          print(
                                            'Updated break times array: $updatedBreakTimes',
                                          );

                                          try {
                                            await dataService.updateTicket(
                                              ticket.id,
                                              {'breakTimes': updatedBreakTimes},
                                            );

                                            print(
                                              'Break times saved successfully to database',
                                            );

                                            if (mounted) {
                                              setState(() {
                                                _isOnBreak = false;
                                                _currentBreakStartTime = null;
                                                _currentBreakReason = null;
                                                _rebuildKey++; // Force rebuild
                                                _ticketFuture = _reloadTicket();
                                              });

                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                const SnackBar(
                                                  content: Text(
                                                    'Break time ended',
                                                  ),
                                                  duration: Duration(
                                                    seconds: 2,
                                                  ),
                                                ),
                                              );
                                            }
                                          } catch (e) {
                                            if (mounted) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                    'Error saving break time: $e',
                                                  ),
                                                ),
                                              );
                                            }
                                          }
                                        }
                                      } else {
                                        // Start break - ask for reason first
                                        final reason = await _showBreakReasonDialog();
                                        if (reason == null) {
                                          // User cancelled
                                          return;
                                        }
                                        setState(() {
                                          _isOnBreak = true;
                                          _currentBreakStartTime = now;
                                          _currentBreakReason = reason;
                                        });
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text('Break time started'),
                                            duration: Duration(seconds: 2),
                                          ),
                                        );
                                      }
                                    },
                                    borderRadius: BorderRadius.circular(8),
                                    child: Padding(
                                      padding: const EdgeInsets.all(8.0),
                                      child: Icon(
                                        _isOnBreak
                                            ? Icons.play_arrow
                                            : Icons.stop,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Show start time if available
                      if (ticket.startTime != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            'Started: ${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(ticket.startTime!))}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      // Show break times if available or ongoing break
                      if (ticket.breakTimes.isNotEmpty || _isOnBreak) ...[
                        const Divider(height: 24),
                        Text(
                          'Break Times',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Debug: Print break times count
                        Builder(
                          builder: (context) {
                            print(
                              'Displaying break times count: ${ticket.breakTimes.length}',
                            );
                            print('Break times data: ${ticket.breakTimes}');
                            return const SizedBox.shrink();
                          },
                        ),
                        // Show completed break times
                        ...ticket.breakTimes.map((breakTime) {
                          try {
                            final start = DateTime.parse(
                              breakTime['start'].toString(),
                            );
                            final end = DateTime.parse(
                              breakTime['end'].toString(),
                            );
                            final reason = breakTime['reason']?.toString() ?? '';
                            print(
                              'Rendering break time: ${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(start))} - ${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(end))}',
                            );
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (reason.isNotEmpty)
                                    Text(
                                      'Reason: $reason',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[800],
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  Text(
                                    '${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(start))} - ${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(end))}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          } catch (e) {
                            print('Error parsing break time: $e');
                            print('Break time data: $breakTime');
                            return const SizedBox.shrink();
                          }
                        }),
                        // Show current ongoing break
                        if (_isOnBreak && _currentBreakStartTime != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (_currentBreakReason != null && _currentBreakReason!.isNotEmpty)
                                  Text(
                                    'Reason: $_currentBreakReason',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[800],
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                Text(
                                  '${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(_currentBreakStartTime!))} - Taking a break...',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFFF59E0B),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const Divider(height: 24),
                      ],
                      // Show completion time if available
                      if (ticket.completionTime != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            'Completed: ${DateFormat('MMM dd, yyyy HH:mm').format(toMyanmarTime(ticket.completionTime!))}',
                            style: TextStyle(
                              fontSize: 12,
                              color: const Color(0xFF10B981),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ...ticket.updates.map(
                        (u) => ListTile(
                          leading: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: Colors.blue,
                              shape: BoxShape.circle,
                            ),
                          ),
                          title: Text(u.message),
                          subtitle: Text(
                            DateFormat.Hm().format(toMyanmarTime(u.time)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Request for Review button - moved to bottom of page
                if (_isEditable && ticket.status.toUpperCase() == 'IN_PROGRESS')
                  PrimaryButton(
                    text: 'Request for Review',
                    icon: Icons.rate_review_outlined,
                    variant: ButtonVariant.primary,
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    onPressed: () async {
                      // Show confirmation dialog
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Request for Review'),
                          content: const Text(
                            'Are you sure you want to submit this ticket for review?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: const Text('Cancel'),
                            ),
                            PrimaryButton(
                              text: 'Submit',
                              variant: ButtonVariant.primary,
                              onPressed: () => Navigator.pop(context, true),
                            ),
                          ],
                        ),
                      );

                      if (confirm == true) {
                        try {
                          await dataService.updateTicket(ticket.id, {
                            'status': 'IN_REVIEW',
                            'technicianCompletionTime': DateTime.now().toIso8601String(),
                          });

                          // Refresh tickets provider to update tasks and profile tabs
                          ref
                              .read(ticketsProvider.notifier)
                              .loadTickets(forceRefresh: true);

                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Ticket submitted for review!'),
                              ),
                            );
                            // Go back to tasks tab
                            Navigator.pop(context);
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error completing ticket: $e'),
                              ),
                            );
                          }
                        }
                      }
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _sectionCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
        ],
      ),
      child: child,
    );
  }
}
