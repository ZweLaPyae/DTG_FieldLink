// lib/ticket_detail.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models.dart';
import '../data_service.dart';
import '../config/design_tokens.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'dart:math';
import '../providers/tickets_provider.dart';

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
  const TicketDetailPage({super.key, required this.ticketId, this.isFromTasksTab = false});

  @override
  ConsumerState<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends ConsumerState<TicketDetailPage> {
  final DataService dataService = DataService();
  late Future<Ticket?> _ticketFuture;
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _wayToFixController = TextEditingController();
  final TextEditingController _rootCauseDetailsController = TextEditingController();
  Set<Polyline> _polylines = {};
  LatLng _initialCenter = const LatLng(13.7563, 100.5018); // fallback
  bool _mapReady = false;
  Set<Marker> _markers = {};
  bool _isOnBreak = false; // Track break time status
  DateTime? _currentBreakStartTime; // Track when current break started
  int _rebuildKey = 0; // Force FutureBuilder rebuild
  bool _isEditingRootCause = false;
  bool _isEditingNotes = false;
  bool _hasChanges = false;
  String? _selectedRootCauseId;
  String? _selectedRootCauseName;
  List<Map<String, dynamic>> _materialsUsed = [];
  List<Map<String, dynamic>> _rootCauseOptions = [];
  List<Map<String, dynamic>> _materialCatalog = [];
  bool _isLoadingRootCauses = true;
  bool _isLoadingMaterials = true;
  
  // Check if ticket is editable (from tasks tab or assigned)
  bool get _isEditable => widget.isFromTasksTab;

  // Helper function to reload ticket with all data
  Future<Ticket?> _reloadTicket() async {
    print('_reloadTicket: Starting ticket reload for ${widget.ticketId}');
    final ticket = await dataService.loadTicketById(widget.ticketId);
    print('_reloadTicket: Loaded ticket with ${ticket?.breakTimes.length ?? 0} break times');
    
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
      
      print('_reloadTicket: Returning ticket with ${finalTicket.breakTimes.length} break times');
      return finalTicket;
    }
    print('_reloadTicket: Ticket was null');
    return null;
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
    final String data = await rootBundle.loadString(
      'assets/MockLocation.geojson',
    );
    final Map<String, dynamic> geojson = json.decode(data);

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
        _addMarkerFromGeoJson(coords, props['Name'] ?? 'Destination');
      }
    }

    setState(() {
      _polylines = polylines;
      _mapReady = true;
    });
  }

  @override
  void initState() {
    super.initState();
    _loadGeoJson();
    _loadRootCauses();
    _loadMaterialCatalog();
    _ticketFuture = _reloadTicket();
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
    _notesController.dispose();
    _wayToFixController.dispose();
    _rootCauseDetailsController.dispose();
    super.dispose();
  }

  Color _priorityColor(String p) {
    final lower = p.toLowerCase();
    if (lower.contains('critical')) return const Color(0xFFDC2626);
    if (lower.contains('high')) return const Color(0xFFF59E0B);
    if (lower.contains('medium')) return const Color(0xFF3B82F6);
    if (lower.contains('low')) return const Color(0xFF6B7280);
    return const Color(0xFF6B7280);
  }

  IconData _priorityIcon(String p) {
    final lower = p.toLowerCase();
    if (lower.contains('critical')) return Icons.warning_amber_rounded;
    if (lower.contains('high')) return Icons.trending_up;
    if (lower.contains('medium')) return Icons.trending_flat;
    if (lower.contains('low')) return Icons.trending_down;
    return Icons.remove;
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
                    value: selectedMaterialId,
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
                        'Unit Cost: \$${selectedMaterial!['unitCost']} per piece',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
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
                        'Unit Cost: \$${selectedMaterial!['unitCost']} per ${selectedMaterial!['referenceLength']}m',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
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
              ElevatedButton(
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
                    cost = quantity * (selectedMaterial!['unitCost'] as num).toDouble();
                  } else if (selectedMaterial!['unit'] == 'METER') {
                    if (startPointController.text.isEmpty || endPointController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter start and end points')),
                      );
                      return;
                    }
                    final startPoint = double.tryParse(startPointController.text) ?? 0;
                    final endPoint = double.tryParse(endPointController.text) ?? 0;
                    final distance = (endPoint - startPoint).abs();
                    final referenceLength = (selectedMaterial!['referenceLength'] as num?)?.toDouble() ?? 1;
                    final unitCost = (selectedMaterial!['unitCost'] as num).toDouble();
                    cost = (distance / referenceLength) * unitCost;
                    quantity = distance.toInt(); // Store distance as quantity for METER type
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
                child: const Text('Add'),
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
        print('FutureBuilder: connectionState = ${snapshot.connectionState}, hasData = ${snapshot.hasData}');
        if (snapshot.hasData) {
          print('FutureBuilder: Ticket has ${snapshot.data?.breakTimes.length ?? 0} break times');
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

        print('FutureBuilder: Rendering ticket with ${ticket.breakTimes.length} break times');

        return Scaffold(
          backgroundColor: DesignTokens.backgroundColor,
          appBar: AppBar(
            title: Text(
              'Ticket ${ticket.id}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            flexibleSpace: Container(
              decoration: BoxDecoration(
                gradient: DesignTokens.primaryGradient,
              ),
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
                    colors: [_priorityColor(ticket.priority), _priorityColor(ticket.priority).withOpacity(0.8)],
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
                    Icon(_priorityIcon(ticket.priority), color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      ticket.priorityDisplay,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
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
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.customerNameDisplay,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Phone Number',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.phone ?? 'N/A',
                        style: const TextStyle(fontWeight: FontWeight.w600),
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
                          Text(
                            ticket.coordinates != null ? '2.4 km' : '',
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Map placeholder
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
                                  zoom: 14,
                                ),
                                polylines: _polylines,
                                markers: _markers,
                                zoomControlsEnabled: true,
                                mapToolbarEnabled: false,
                              ),
                      ),

                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF2563EB),
                                side: const BorderSide(
                                  color: Color(0xFF2563EB),
                                ),
                              ),
                              icon: const Icon(Icons.navigation_outlined),
                              label: const Text('Directions'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF2563EB),
                                side: const BorderSide(
                                  color: Color(0xFF2563EB),
                                ),
                              ),
                              icon: const Icon(Icons.call),
                              label: const Text('Call'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Issue', style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 6),
                      Text(
                        ticket.complaint,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Assigned Technician',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.technicianDisplay,
                        style: const TextStyle(fontWeight: FontWeight.w700),
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
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                          ),
                          if (_isEditable)
                            IconButton(
                              icon: Icon(
                                _isEditingRootCause ? Icons.close : Icons.edit,
                                color: _isEditingRootCause ? Colors.red : const Color(0xFF3B82F6),
                              ),
                              onPressed: () {
                                setState(() {
                                  _isEditingRootCause = !_isEditingRootCause;
                                  if (!_isEditingRootCause) {
                                    // Reset to original values if canceling
                                    _wayToFixController.text = ticket.wayToFix ?? '';
                                    _rootCauseDetailsController.text = '';
                                    _selectedRootCauseId = null;
                                    _selectedRootCauseName = null;
                                  } else {
                                    // Initialize with current values
                                    _wayToFixController.text = ticket.wayToFix ?? '';
                                    _rootCauseDetailsController.text = ticket.rootCause ?? '';
                                    _selectedRootCauseName = ticket.rootCauseDisplay;
                                    // Find the ID from the name
                                    if (ticket.rootCauseDisplay != null && _rootCauseOptions.isNotEmpty) {
                                      final match = _rootCauseOptions.firstWhere(
                                        (rc) => rc['name'] == ticket.rootCauseDisplay,
                                        orElse: () => {},
                                      );
                                      _selectedRootCauseId = match['id']?.toString();
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
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      if (_isEditingRootCause)
                        _isLoadingRootCauses
                            ? const Center(child: CircularProgressIndicator())
                            : DropdownButtonFormField<String>(
                                value: _selectedRootCauseId,
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFF3B82F6)),
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
                                    final selected = _rootCauseOptions.firstWhere(
                                      (opt) => opt['id'].toString() == value,
                                      orElse: () => {},
                                    );
                                    _selectedRootCauseName = selected['name']?.toString();
                                    _hasChanges = true;
                                  });
                                },
                              )
                      else
                        Text(
                          ticket.rootCauseDisplay ?? 'N/A',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      const SizedBox(height: 12),
                      const Text(
                        'Root Cause Details',
                        style: TextStyle(color: Colors.grey),
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
                              borderSide: const BorderSide(color: Color(0xFF3B82F6)),
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
                        Text(
                          ticket.rootCause ?? 'N/A',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      const SizedBox(height: 12),
                      const Text(
                        'Way to Fix',
                        style: TextStyle(color: Colors.grey),
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
                              borderSide: const BorderSide(color: Color(0xFF3B82F6)),
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
                        Text(
                          ticket.wayToFix ?? 'N/A',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Materials Used',
                            style: TextStyle(color: Colors.grey),
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
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                    topRight: Radius.circular(8),
                                  ),
                                ),
                                child: Row(
                                  children: const [
                                    Expanded(flex: 3, child: Text('Material', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                                    Expanded(flex: 2, child: Text('Unit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                                    Expanded(flex: 2, child: Text('Cost', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
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
                                  orElse: () => {'name': 'Unknown', 'unit': 'PIECE'},
                                );
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(color: Colors.grey.shade200),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(flex: 3, child: Text('${material['name']}', style: const TextStyle(fontSize: 13))),
                                      Expanded(flex: 2, child: Text('${m['quantity']} ${material['unit']?.toString().toLowerCase() ?? 'unit'}', style: const TextStyle(fontSize: 13))),
                                      Expanded(flex: 2, child: Text('\$${m['cost']?.toStringAsFixed(2) ?? '0.00'}', style: const TextStyle(fontSize: 13, color: Color(0xFF10B981)))),
                                      IconButton(
                                        icon: const Icon(Icons.delete, color: Colors.red, size: 18),
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
                      else if (!_isEditingRootCause && ticket.materialsUsed.isNotEmpty)
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              // Table header
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                    topRight: Radius.circular(8),
                                  ),
                                ),
                                child: Row(
                                  children: const [
                                    Expanded(flex: 3, child: Text('Material', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                                    Expanded(flex: 2, child: Text('Unit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                                    Expanded(flex: 2, child: Text('Cost', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                                  ],
                                ),
                              ),
                              // Table rows
                              ...ticket.materialsUsed.map((m) {
                                final material = _materialCatalog.firstWhere(
                                  (mat) => mat['id'] == m['materialId'],
                                  orElse: () => {'name': 'Material #${m['materialId']}', 'unit': 'PIECE'},
                                );
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(color: Colors.grey.shade200),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(flex: 3, child: Text('${material['name']}', style: const TextStyle(fontSize: 13))),
                                      Expanded(flex: 2, child: Text('${m['quantity']} ${material['unit']?.toString().toLowerCase() ?? 'unit'}', style: const TextStyle(fontSize: 13))),
                                      Expanded(flex: 2, child: Text('\$${m['cost']?.toStringAsFixed(2) ?? '0.00'}', style: const TextStyle(fontSize: 13, color: Color(0xFF10B981)))),
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
                        '\$${_isEditingRootCause ? _calculateTotalCost().toStringAsFixed(2) : (ticket.totalCost ?? 0).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: Color(0xFF10B981)),
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
                        children: const [
                          Text(
                            'Fault Media',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text('3 files', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 90,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            _mediaThumb('damage_photo_1.jpg'),
                            const SizedBox(width: 8),
                            _mediaThumb('repair_video.mp4', isVideo: true),
                            const SizedBox(width: 8),
                            _mediaThumb('photo3.jpg'),
                            if (_isEditable) ...[
                            const SizedBox(width: 8),
                            _addMediaButton(Icons.photo, 'Add Photo'),
                            const SizedBox(width: 8),
                            _addMediaButton(Icons.videocam, 'Add Video'),
                            const SizedBox(width: 8),
                            _addMediaButton(Icons.camera_alt, 'Capture'),
                            ],
                          ],
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
                            'Technician Notes',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                          ),
                          if (_isEditable)
                            IconButton(
                              icon: Icon(
                                _isEditingNotes ? Icons.close : Icons.edit,
                                color: _isEditingNotes ? Colors.red : const Color(0xFF3B82F6),
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
                      TextField(
                        controller: _notesController,
                        maxLines: 4,
                        enabled: _isEditable && _isEditingNotes,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: (_isEditable && _isEditingNotes) ? Colors.white : Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: (_isEditable && _isEditingNotes) ? const Color(0xFF3B82F6) : Colors.grey.shade300,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: (_isEditable && _isEditingNotes) ? const Color(0xFF3B82F6) : Colors.grey.shade300,
                            ),
                          ),
                          hintText: _isEditable ? 'Add your notes here...' : 'No notes available',
                        ),
                        onChanged: (value) {
                          setState(() {
                            _hasChanges = true;
                          });
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Save Update button - only visible when editable and has changes
                if (_isEditable && _hasChanges)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        // Save ticket updates
                        final updates = <String, dynamic>{};
                        
                        if (_isEditingRootCause) {
                          if (_selectedRootCauseId != null) {
                            updates['rootCauseId'] = _selectedRootCauseId;
                          }
                          if (_rootCauseDetailsController.text.isNotEmpty) {
                            updates['rootCauseDetails'] = _rootCauseDetailsController.text;
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
                          ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true);
                          setState(() {
                            _hasChanges = false;
                            _isEditingRootCause = false;
                            _isEditingNotes = false;
                          });
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Ticket updated successfully')),
                            );
                            // Reload ticket data with controller reinitialization
                            setState(() {
                              _ticketFuture = dataService.loadTicketById(widget.ticketId).then((
                                ticket,
                              ) async {
                                if (ticket != null) {
                                  final customer = await dataService.loadCustomerById(ticket.customerId);
                                  if (ticket.materialsUsed.isNotEmpty) {
                                    _materialsUsed = List<Map<String, dynamic>>.from(ticket.materialsUsed);
                                  }
                                  // Reinitialize controllers with fresh data
                                  _notesController.text = ticket.technicianNote ?? '';
                                  _wayToFixController.text = ticket.wayToFix ?? '';
                                  _rootCauseDetailsController.text = ticket.rootCause ?? '';
                                  
                                  return ticket.copyWith(
                                    customerNameDisplay: customer?.name ?? ticket.customerNameDisplay,
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
                              SnackBar(content: Text('Error updating ticket: $e')),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: const Text(
                        'Save Update',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                if (_isEditable && _hasChanges)
                  const SizedBox(height: 12),
                // Complete button - only visible when editable and status is not completed
                if (_isEditable && !ticket.status.toUpperCase().contains('COMPLETED'))
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        // Show confirmation dialog
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Complete Ticket'),
                            content: const Text('Are you sure you want to mark this ticket as completed?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF10B981),
                                ),
                                child: const Text('Complete'),
                              ),
                            ],
                          ),
                        );
                        
                        if (confirm == true) {
                          try {
                            await dataService.updateTicket(ticket.id, {
                              'status': 'COMPLETED',
                              'completionTime': DateTime.now().toIso8601String(),
                            });
                            
                            // Refresh tickets provider to update tasks and profile tabs
                            ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true);
                            
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Ticket marked as completed!')),
                              );
                              // Go back to tasks tab
                              Navigator.pop(context);
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Error completing ticket: $e')),
                              );
                            }
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_outline),
                          SizedBox(width: 8),
                          Text(
                            'Complete Ticket',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (_isEditable && !ticket.status.toUpperCase().contains('COMPLETED'))
                  const SizedBox(height: 12),
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
                          if (_isEditable)
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
                                      ? "Press 'Continue' to end break"
                                      : "Press 'Stop' to start break",
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Material(
                                  color: _isOnBreak ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                  borderRadius: BorderRadius.circular(8),
                                  child: InkWell(
                                    onTap: () async {
                                      final now = DateTime.now();
                                      
                                      if (_isOnBreak) {
                                        // End break - save to database
                                        if (_currentBreakStartTime != null) {
                                          // Get the latest ticket data first
                                          final latestTicket = await dataService.loadTicketById(widget.ticketId);
                                          if (latestTicket == null) {
                                            if (mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(content: Text('Error: Could not load ticket data')),
                                              );
                                            }
                                            return;
                                          }
                                          
                                          print('=== ENDING BREAK ===');
                                          print('Latest ticket breakTimes count: ${latestTicket.breakTimes.length}');
                                          print('Latest ticket breakTimes: ${latestTicket.breakTimes}');
                                          
                                          final updatedBreakTimes = List<Map<String, dynamic>>.from(latestTicket.breakTimes);
                                          updatedBreakTimes.add({
                                            'start': _currentBreakStartTime!.toIso8601String(),
                                            'end': now.toIso8601String(),
                                          });
                                          
                                          print('Updated break times count: ${updatedBreakTimes.length}');
                                          print('Updated break times array: $updatedBreakTimes');
                                          
                                          try {
                                            await dataService.updateTicket(ticket.id, {
                                              'breakTimes': updatedBreakTimes,
                                            });
                                            
                                            print('Break times saved successfully to database');
                                            
                                            if (mounted) {
                                              setState(() {
                                                _isOnBreak = false;
                                                _currentBreakStartTime = null;
                                                _rebuildKey++; // Force rebuild
                                                _ticketFuture = _reloadTicket();
                                              });
                                              
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(
                                                  content: Text('Break time ended'),
                                                  duration: Duration(seconds: 2),
                                                ),
                                              );
                                            }
                                          } catch (e) {
                                            if (mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(content: Text('Error saving break time: $e')),
                                              );
                                            }
                                          }
                                        }
                                      } else {
                                        // Start break
                                        setState(() {
                                          _isOnBreak = true;
                                          _currentBreakStartTime = now;
                                        });
                                        ScaffoldMessenger.of(context).showSnackBar(
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
                                        _isOnBreak ? Icons.play_arrow : Icons.stop,
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
                            'Started: ${DateFormat('MMM dd, yyyy HH:mm').format(ticket.startTime!.toLocal())}',
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
                        Builder(builder: (context) {
                          print('Displaying break times count: ${ticket.breakTimes.length}');
                          print('Break times data: ${ticket.breakTimes}');
                          return const SizedBox.shrink();
                        }),
                        // Show completed break times
                        ...ticket.breakTimes.map((breakTime) {
                          try {
                            final start = DateTime.parse(breakTime['start'].toString());
                            final end = DateTime.parse(breakTime['end'].toString());
                            print('Rendering break time: ${DateFormat('MMM dd, yyyy HH:mm').format(start.toLocal())} - ${DateFormat('MMM dd, yyyy HH:mm').format(end.toLocal())}');
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '${DateFormat('MMM dd, yyyy HH:mm').format(start.toLocal())} - ${DateFormat('MMM dd, yyyy HH:mm').format(end.toLocal())}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
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
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(
                              '${DateFormat('MMM dd, yyyy HH:mm').format(_currentBreakStartTime!.toLocal())} - In Progress...',
                              style: TextStyle(
                                fontSize: 12,
                                color: const Color(0xFFF59E0B),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        const Divider(height: 24),
                      ],
                      // Show completion time if available
                      if (ticket.completionTime != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            'Completed: ${DateFormat('MMM dd, yyyy HH:mm').format(ticket.completionTime!.toLocal())}',
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
                            DateFormat.Hm().format(u.time.toLocal()),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _sectionCard({required Widget child, Color? accentColor}) {
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

  Widget _mediaThumb(String filename, {bool isVideo = false}) {
    return Stack(
      children: [
        Container(
          width: 100,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(8),
            image: const DecorationImage(
              image: AssetImage('assets/placeholder.png'),
              fit: BoxFit.cover,
            ),
          ),
          child: Center(
            child: isVideo
                ? const Icon(Icons.videocam)
                : const SizedBox.shrink(),
          ),
        ),
        if (_isEditable)
          Positioned(
            right: 4,
            top: 4,
            child: GestureDetector(
              onTap: () {
                // remove action stub
              },
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 18),
              ),
            ),
          ),
      ],
    );
  }

  Widget _addMediaButton(IconData icon, String label) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _statusToggle(String label, bool active) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: active ? Colors.blue.shade50 : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? Colors.blue : Colors.grey.shade600,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
