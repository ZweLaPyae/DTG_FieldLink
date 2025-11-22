// lib/ticket_detail.dart
import 'package:flutter/material.dart';
import '../models.dart';
import '../data_service.dart';
import 'package:intl/intl.dart';

class TicketDetailPage extends StatefulWidget {
  final String ticketId;
  const TicketDetailPage({super.key, required this.ticketId});

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage> {
  final DataService dataService = DataService(jsonPath: 'lib/mock_database.json');
  late Future<Ticket?> _ticketFuture;
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _ticketFuture = dataService.loadTicketById(widget.ticketId);
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Color _priorityColor(String p) {
    final lower = p.toLowerCase();
    if (lower.contains('critical')) return Colors.red.shade400;
    if (lower.contains('high')) return Colors.red;
    if (lower.contains('medium')) return Colors.orange;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Ticket?>(
      future: _ticketFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final ticket = snapshot.data;
        if (ticket == null) {
          return Scaffold(appBar: AppBar(title: const Text('Ticket not found')), body: const Center(child: Text('Ticket not found')));
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF5F6FA),
          appBar: AppBar(
            title: Text('Ticket ${ticket.id}', style: const TextStyle(fontWeight: FontWeight.w600)),
            backgroundColor: const Color.fromARGB(255, 122, 182, 212),
            leading: BackButton(onPressed: () => Navigator.pop(context)),
            actions: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(ticket.statusDisplay),
              ),
              const SizedBox(width: 8),
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Customer', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text('${ticket.customerNameDisplay} — ${ticket.phone ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    const Text('Location', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text(ticket.location, style: const TextStyle(fontWeight: FontWeight.w600)),
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Navigate', style: TextStyle(fontWeight: FontWeight.w700)),
                      Text(ticket.coordinates != null ? '2.4 km' : '', style: const TextStyle(color: Colors.grey)),
                    ]),
                    const SizedBox(height: 8),
                    // Map placeholder
                    Container(
                      height: 150,
                      decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(12)),
                      child: const Center(child: Text('Map placeholder', style: TextStyle(color: Colors.grey))),
                    ),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color.fromARGB(255, 122, 182, 212),
                            side: BorderSide(color: const Color.fromARGB(255, 122, 182, 212)),
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
                            foregroundColor: const Color.fromARGB(255, 122, 182, 212),
                            side: BorderSide(color: const Color.fromARGB(255, 122, 182, 212)),
                          ),
                          icon: const Icon(Icons.call),
                          label: const Text('Call'),
                        ),
                      ),
                    ]),
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Issue', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text(ticket.complaint, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    const Text('Assigned Technician', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text(ticket.technicianDisplay, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Row(children: [
                      _statusToggle('Pending', ticket.status.toLowerCase().contains('pending')),
                      const SizedBox(width: 8),
                      _statusToggle('In Progress', ticket.status.toLowerCase().contains('in-progress') || ticket.status.toLowerCase().contains('in progress')),
                      const SizedBox(width: 8),
                      _statusToggle('Done', ticket.status.toLowerCase().contains('completed')),
                    ]),
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: const [
                      Text('Fault Media', style: TextStyle(fontWeight: FontWeight.w700)),
                      Text('3 files', style: TextStyle(color: Colors.grey)),
                    ]),
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
                    )
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Technician Notes', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _notesController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        hintText: 'Optional',
                      ),
                    )
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Activity', style: TextStyle(fontWeight: FontWeight.w700)),
                      Text('Today', style: TextStyle(color: Colors.grey[600])),
                    ]),
                    const SizedBox(height: 8),
                    ...ticket.updates.map((u) => ListTile(
                          leading: Container(width: 10, height: 10, decoration: BoxDecoration(color: Colors.blue, shape: BoxShape.circle)),
                          title: Text(u.message),
                          subtitle: Text(DateFormat.Hm().format(u.time.toLocal())),
                        )),
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
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Updates saved')));
                            _notesController.clear();
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No changes to save')));
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(255, 122, 182, 212),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Save Updates'),
                      ),
                    )
                  ]),
                ),
                const SizedBox(height: 60),
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
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6)]),
      child: child,
    );
  }

  Widget _mediaThumb(String filename, {bool isVideo = false}) {
    return Stack(children: [
      Container(
        width: 100,
        height: 80,
        decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(8), image: const DecorationImage(image: AssetImage('assets/placeholder.png'), fit: BoxFit.cover)),
        child: Center(child: isVideo ? const Icon(Icons.videocam) : const SizedBox.shrink()),
      ),
      Positioned(
        right: 4,
        top: 4,
        child: GestureDetector(
          onTap: () {
            // remove action stub
          },
          child: Container(decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.close, size: 18)),
        ),
      )
    ]);
  }

  Widget _addMediaButton(IconData icon, String label) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(icon), const SizedBox(height: 6), Text(label, style: const TextStyle(fontSize: 12))]),
      ),
    );
  }

  Widget _statusToggle(String label, bool active) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: active ? Colors.blue.shade50 : Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: TextStyle(color: active ? Colors.blue : Colors.grey.shade600, fontWeight: FontWeight.w600)),
    );
  }
}
