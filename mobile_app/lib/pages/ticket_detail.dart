// lib/ticket_detail.dart
import 'package:flutter/material.dart';
import '../models.dart';
import '../data_service.dart';
import 'package:intl/intl.dart';

class TicketDetailPage extends StatefulWidget {
  final String ticketId;
  final bool isFromTasksTab;
  const TicketDetailPage({super.key, required this.ticketId, this.isFromTasksTab = false});

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage> {
  final DataService dataService = DataService();
  late Future<Ticket?> _ticketFuture;
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _materialItemController = TextEditingController();
  final TextEditingController _materialCostController = TextEditingController();
  final TextEditingController _totalCostController = TextEditingController();
  List<Map<String, dynamic>> _materialsUsed = [];

  @override
  void initState() {
    super.initState();
    _ticketFuture = dataService.loadTicketById(widget.ticketId).then((ticket) async {
      if (ticket != null) {
        final customer = await dataService.loadCustomerById(ticket.customerId);
        // Initialize materials
        _materialsUsed = List<Map<String, dynamic>>.from(ticket.materialsUsed);
        _totalCostController.text = ticket.totalCost?.toString() ?? '0';
        return ticket.copyWith(customerNameDisplay: customer?.name ?? ticket.customerNameDisplay, phone: customer?.phone);
      }
      return ticket;
    });
  }

  @override
  void dispose() {
    _notesController.dispose();
    _materialItemController.dispose();
    _materialCostController.dispose();
    _totalCostController.dispose();
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
          backgroundColor: const Color(0xFFF8F9FC),
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 120,
                floating: false,
                pinned: true,
                elevation: 0,
                flexibleSpace: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: FlexibleSpaceBar(
                    title: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ticket.id,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Ticket Details',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                    titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
                  ),
                ),
                leading: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Customer info on the left
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Customer', style: TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(ticket.customerNameDisplay, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                            const SizedBox(height: 8),
                            const Text('Phone', style: TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(ticket.phone ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          ],
                        ),
                      ),
                      // Status and Priority tags on the right
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
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
                          const SizedBox(height: 8),
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
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Navigation', style: TextStyle(fontWeight: FontWeight.w700)),
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
                    if (widget.isFromTasksTab) ...[
                      const SizedBox(height: 20),
                      const Text('Update Status', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF1E293B))),
                      const SizedBox(height: 12),
                      _largeStatusButton(
                        'START JOB',
                        Icons.play_circle_filled,
                        const Color(0xFF3B82F6),
                        !ticket.status.toLowerCase().contains('in-progress') && !ticket.status.toLowerCase().contains('completed'),
                        () async {
                          final success = await dataService.updateTicket(widget.ticketId, {'status': 'IN_PROGRESS'});
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Job started!')),
                            );
                            setState(() {
                              _ticketFuture = dataService.loadTicketById(widget.ticketId).then((ticket) async {
                                if (ticket != null) {
                                  final customer = await dataService.loadCustomerById(ticket.customerId);
                                  return ticket.copyWith(customerNameDisplay: customer?.name ?? ticket.customerNameDisplay, phone: customer?.phone);
                                }
                                return ticket;
                              });
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      _largeStatusButton(
                        'COMPLETE JOB',
                        Icons.check_circle,
                        const Color(0xFF10B981),
                        ticket.status.toLowerCase().contains('in-progress'),
                        () async {
                          final success = await dataService.updateTicket(widget.ticketId, {'status': 'COMPLETED'});
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Job completed!')),
                            );
                            setState(() {
                              _ticketFuture = dataService.loadTicketById(widget.ticketId).then((ticket) async {
                                if (ticket != null) {
                                  final customer = await dataService.loadCustomerById(ticket.customerId);
                                  return ticket.copyWith(customerNameDisplay: customer?.name ?? ticket.customerNameDisplay, phone: customer?.phone);
                                }
                                return ticket;
                              });
                            });
                          }
                        },
                      ),
                    ],
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Root Cause', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text(ticket.rootCauseDisplay ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    const Text('Way to Fix', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text(ticket.wayToFix ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (widget.isFromTasksTab) ...[
                      const SizedBox(height: 20),
                      const Divider(),
                      const SizedBox(height: 12),
                      const Text('Materials Used', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 12),
                      // Add material form
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextField(
                              controller: _materialItemController,
                              decoration: const InputDecoration(
                                labelText: 'Item',
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _materialCostController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Cost (USD)',
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () {
                              if (_materialItemController.text.isNotEmpty && _materialCostController.text.isNotEmpty) {
                                setState(() {
                                  _materialsUsed.add({
                                    'item': _materialItemController.text,
                                    'cost': double.tryParse(_materialCostController.text) ?? 0,
                                  });
                                  // Update total cost
                                  double total = _materialsUsed.fold(0, (sum, m) => sum + (m['cost'] as num));
                                  _totalCostController.text = total.toStringAsFixed(2);
                                  _materialItemController.clear();
                                  _materialCostController.clear();
                                });
                              }
                            },
                            icon: const Icon(Icons.add_circle, color: Color(0xFF10B981)),
                            iconSize: 32,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // List of materials
                      ..._materialsUsed.asMap().entries.map((entry) {
                        final index = entry.key;
                        final m = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${m['item']} - \$${m['cost']}',
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ),
                              IconButton(
                                onPressed: () {
                                  setState(() {
                                    _materialsUsed.removeAt(index);
                                    // Update total cost
                                    double total = _materialsUsed.fold(0, (sum, mat) => sum + (mat['cost'] as num));
                                    _totalCostController.text = total.toStringAsFixed(2);
                                  });
                                },
                                icon: const Icon(Icons.delete, color: Colors.red),
                                iconSize: 20,
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 12),
                      const Text('Total Cost', style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _totalCostController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          suffixText: 'USD',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ] else ...[
                      const SizedBox(height: 12),
                      const Text('Materials Used', style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 6),
                      ...ticket.materialsUsed.map((m) => Text('${m['item']} - ${m['cost']} USD', style: const TextStyle(fontWeight: FontWeight.w600))),
                      const SizedBox(height: 12),
                      const Text('Total Cost', style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 6),
                      Text('${ticket.totalCost ?? 0} USD', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ]),
                ),
                const SizedBox(height: 12),
                _sectionCard(
                  accentColor: const Color(0xFF3B82F6),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Site Photos', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        Text('Required', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Large photo capture buttons
                    Row(
                      children: [
                        Expanded(
                          child: _photoActionButton(
                            icon: Icons.camera_alt,
                            label: 'Take Photo',
                            color: const Color(0xFF3B82F6),
                            onTap: () {
                              // TODO: Implement camera capture
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _photoActionButton(
                            icon: Icons.photo_library,
                            label: 'Gallery',
                            color: const Color(0xFF10B981),
                            onTap: () {
                              // TODO: Implement gallery picker
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 100,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _mediaThumb('damage_photo_1.jpg'),
                          const SizedBox(width: 12),
                          _mediaThumb('repair_video.mp4', isVideo: true),
                          const SizedBox(width: 12),
                          _mediaThumb('photo3.jpg'),
                        ],
                      ),
                    ),
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
                      enabled: widget.isFromTasksTab,
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
                    if (widget.isFromTasksTab) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () async {
                            // Save all updates
                            final updates = {
                              'notes': _notesController.text.trim(),
                              'materialsUsed': _materialsUsed,
                              'totalCost': double.tryParse(_totalCostController.text) ?? 0,
                            };
                            
                            final success = await dataService.updateTicket(widget.ticketId, updates);
                            
                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Updates saved successfully!')),
                              );
                              // Refresh ticket data
                              setState(() {
                                _ticketFuture = dataService.loadTicketById(widget.ticketId).then((ticket) async {
                                  if (ticket != null) {
                                    final customer = await dataService.loadCustomerById(ticket.customerId);
                                    _materialsUsed = List<Map<String, dynamic>>.from(ticket.materialsUsed);
                                    _totalCostController.text = ticket.totalCost?.toString() ?? '0';
                                    return ticket.copyWith(customerNameDisplay: customer?.name ?? ticket.customerNameDisplay, phone: customer?.phone);
                                  }
                                  return ticket;
                                });
                              });
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Failed to save updates')),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Save Updates'),
                        ),
                      ),
                    ],
                  ]),
                ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _sectionCard({required Widget child, Color? accentColor}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (accentColor ?? const Color(0xFF3B82F6)).withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: accentColor != null
            ? Border.all(color: accentColor.withOpacity(0.1), width: 1)
            : null,
      ),
      child: child,
    );
  }

  Widget _mediaThumb(String filename, {bool isVideo = false}) {
    return Stack(children: [
      Container(
        width: 100,
        height: 80,
        decoration: BoxDecoration(
          color: Colors.grey.shade200, 
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: isVideo 
            ? const Icon(Icons.videocam, size: 32, color: Colors.grey) 
            : const Icon(Icons.image, size: 32, color: Colors.grey)
        ),
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

  Widget _largeStatusButton(String label, IconData icon, Color color, bool isEnabled, VoidCallback onTap) {
    return Opacity(
      opacity: isEnabled ? 1.0 : 0.5,
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withOpacity(0.8)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: isEnabled
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ]
              : [],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isEnabled ? onTap : null,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 28, color: Colors.white),
                  const SizedBox(width: 16),
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 17,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _photoActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 28, color: Colors.white),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
