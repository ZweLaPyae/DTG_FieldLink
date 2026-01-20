// lib/ticket_detail.dart
import 'package:flutter/material.dart';
import '../models.dart';
import '../data_service.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'dart:math';

LatLngBounds boundsFromPoints(List<LatLng> points) {
  final lats = points.map((p) => p.latitude);
  final lngs = points.map((p) => p.longitude);

  return LatLngBounds(
    southwest: LatLng(lats.reduce(min), lngs.reduce(min)),
    northeast: LatLng(lats.reduce(max), lngs.reduce(max)),
  );
}

class TicketDetailPage extends StatefulWidget {
  final String ticketId;
  final bool isFromTasksTab;
  const TicketDetailPage({super.key, required this.ticketId, this.isFromTasksTab = false});

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage> {
  final DataService dataService = DataService(
    jsonPath: 'lib/mock_database_mod.json',
  );
  late Future<Ticket?> _ticketFuture;
  final TextEditingController _notesController = TextEditingController();
  Set<Polyline> _polylines = {};
  LatLng _initialCenter = const LatLng(13.7563, 100.5018); // fallback
  bool _mapReady = false;
  Set<Marker> _markers = {};

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
    _ticketFuture = dataService.loadTicketById(widget.ticketId).then((
      ticket,
    ) async {
      if (ticket != null) {
        final customer = await dataService.loadCustomerById(ticket.customerId);
        return ticket.copyWith(
          customerNameDisplay: customer?.name ?? ticket.customerNameDisplay,
          phone: customer?.phone,
        );
      }
      return ticket;
    });
  }

  @override
  void dispose() {
    _notesController.dispose();
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

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Ticket?>(
      future: _ticketFuture,
      builder: (context, snapshot) {
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

        return Scaffold(
          backgroundColor: const Color(0xFFF5F6FA),
          appBar: AppBar(
            title: Text(
              'Ticket ${ticket.id}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color.fromARGB(255, 122, 182, 212),
            leading: BackButton(onPressed: () => Navigator.pop(context)),
            actions: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(ticket.statusDisplay),
              ),
              const SizedBox(width: 8),
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _priorityColor(ticket.priority).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(ticket.priorityDisplay),
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: Padding(
            padding: const EdgeInsets.all(14),
            child: ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      if (widget.isFromTasksTab)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: ticket.status.toLowerCase().contains('in-progress')
                              ? const Color(0xFF3B82F6).withOpacity(0.12)
                              : const Color(0xFF10B981).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          ticket.statusDisplay,
                          style: TextStyle(
                            color: ticket.status.toLowerCase().contains('in-progress')
                                ? const Color(0xFF3B82F6)
                                : const Color(0xFF10B981),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (widget.isFromTasksTab)
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _priorityColor(ticket.priority).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          ticket.priorityDisplay,
                          style: TextStyle(
                            color: _priorityColor(ticket.priority),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
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
                        '${ticket.customerNameDisplay} — ${ticket.phone ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Location',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.location,
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
                                foregroundColor: const Color.fromARGB(
                                  255,
                                  122,
                                  182,
                                  212,
                                ),
                                side: BorderSide(
                                  color: const Color.fromARGB(
                                    255,
                                    122,
                                    182,
                                    212,
                                  ),
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
                                foregroundColor: const Color.fromARGB(
                                  255,
                                  122,
                                  182,
                                  212,
                                ),
                                side: BorderSide(
                                  color: const Color.fromARGB(
                                    255,
                                    122,
                                    182,
                                    212,
                                  ),
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
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _statusToggle(
                            'Pending',
                            ticket.status.toLowerCase().contains('pending'),
                          ),
                          const SizedBox(width: 8),
                          _statusToggle(
                            'In Progress',
                            ticket.status.toLowerCase().contains(
                                  'in-progress',
                                ) ||
                                ticket.status.toLowerCase().contains(
                                  'in progress',
                                ),
                          ),
                          const SizedBox(width: 8),
                          _statusToggle(
                            'Done',
                            ticket.status.toLowerCase().contains('completed'),
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
                      const Text(
                        'Root Cause',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.rootCauseDisplay ?? 'N/A',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Way to Fix',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.wayToFix ?? 'N/A',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Materials Used',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      ...ticket.materialsUsed.map(
                        (m) => Text(
                          '${m['item']} - ${m['cost']} USD',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Total Cost',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${ticket.totalCost ?? 0} USD',
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
                            const SizedBox(width: 8),
                            _addMediaButton(Icons.photo, 'Add Photo'),
                            const SizedBox(width: 8),
                            _addMediaButton(Icons.videocam, 'Add Video'),
                            const SizedBox(width: 8),
                            _addMediaButton(Icons.camera_alt, 'Capture'),
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
                      const Text(
                        'Technician Notes',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _notesController,
                        maxLines: 4,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          hintText: 'Optional',
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
                            'Activity',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Today',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
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
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () {
                            // Save updates stub
                            final noteText = _notesController.text.trim();
                            if (noteText.isNotEmpty) {
                              // In production, call API to save.
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Updates saved')),
                              );
                              _notesController.clear();
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('No changes to save'),
                                ),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color.fromARGB(
                              255,
                              122,
                              182,
                              212,
                            ),
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Save Updates'),
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
