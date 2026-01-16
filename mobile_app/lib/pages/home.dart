// lib/home.dart
import 'package:flutter/material.dart';
import '../models.dart';
import '../data_service.dart';
import 'ticket_detail.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final DataService dataService = DataService(jsonPath: 'lib/mock_database_mod.json');
  int _currentIndex = 0;
  String _priorityFilter = 'all';
  bool _sortAscending = true; // true = low to critical, false = critical to low

  @override
  Widget build(BuildContext context) {
    Widget bodyContent;
    
    if (_currentIndex == 0) {
      // Tickets Tab - Available tickets
      bodyContent = _buildTicketsTab();
    } else if (_currentIndex == 1) {
      // Tasks Tab - Assigned tickets
      bodyContent = _buildTasksTab();
    } else {
      // Profile Tab
      bodyContent = _buildProfileTab();
    }
    
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF2563EB),
        title: const Text('DTG FieldLink', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
        leading: const Padding(
          padding: EdgeInsets.only(left: 12),
          child: Icon(Icons.wifi, color: Colors.white),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.menu, color: Colors.white),
            onSelected: (value) {
              if (value == 'logout') {
                // Handle logout
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings, size: 20),
                    SizedBox(width: 12),
                    Text('Settings'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'help',
                child: Row(
                  children: [
                    Icon(Icons.help, size: 20),
                    SizedBox(width: 12),
                    Text('Help & Support'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.red, size: 20),
                    SizedBox(width: 12),
                    Text('Logout', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: bodyContent,
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color(0xFF2563EB),
        currentIndex: _currentIndex,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white70,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.confirmation_number_outlined), label: 'Tickets'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildTicketsTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Available Tickets',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  IconButton(
                    icon: Icon(
                      _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
                      color: const Color(0xFF2563EB),
                    ),
                    onPressed: () {
                      setState(() {
                        _sortAscending = !_sortAscending;
                      });
                    },
                  ),
                  PopupMenuButton<String>(
                icon: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.filter_list, size: 18, color: Color(0xFF2563EB)),
                      const SizedBox(width: 4),
                      Text(
                        _priorityFilter == 'all' ? 'All' : _priorityFilter.toUpperCase(),
                        style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                onSelected: (value) {
                  setState(() {
                    _priorityFilter = value;
                  });
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'all', child: Text('All Priority')),
                  const PopupMenuItem(value: 'low', child: Text('Low')),
                  const PopupMenuItem(value: 'medium', child: Text('Medium')),
                  const PopupMenuItem(value: 'high', child: Text('High')),
                  const PopupMenuItem(value: 'critical', child: Text('Critical')),
                ],
              ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        const Text('New maintenance requests', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 10),
        Expanded(
          child: FutureBuilder<List<Ticket>>(
            future: dataService.loadTickets(),
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text('Error: ${snapshot.error}'));
              }
              final allTickets = snapshot.data ?? [];
              // Filter for available tickets (show all tickets for now)
              var tickets = allTickets.where((t) {
                if (_priorityFilter == 'all') return true;
                return t.priority.toLowerCase() == _priorityFilter;
              }).toList();
              
              // Sort tickets by priority
              tickets.sort((a, b) {
                const priorityOrder = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4};
                final aPriority = priorityOrder[a.priority.toLowerCase()] ?? 0;
                final bPriority = priorityOrder[b.priority.toLowerCase()] ?? 0;
                return _sortAscending ? aPriority.compareTo(bPriority) : bPriority.compareTo(aPriority);
              });
              
              if (tickets.isEmpty) {
                return const Center(child: Text('No available tickets', style: TextStyle(color: Colors.grey)));
              }
              
              return ListView.builder(
                itemCount: tickets.length,
                itemBuilder: (context, index) {
                  final t = tickets[index];
                  final customerFuture = dataService.loadCustomerById(t.customerId);
                  return FutureBuilder<Customer?>(
                    future: customerFuture,
                    builder: (context, customerSnapshot) {
                      if (customerSnapshot.connectionState != ConnectionState.done) {
                        return const SizedBox();
                      }
                      final customer = customerSnapshot.data;
                      return _ticketCard(context, t, customer, showStatus: false);
                    },
                  );
                },
              );
            },
          ),
        ),
      ]),
    );
  }

  Widget _buildTasksTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'My Tasks',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  IconButton(
                    icon: Icon(
                      _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
                      color: const Color(0xFF2563EB),
                    ),
                    onPressed: () {
                      setState(() {
                        _sortAscending = !_sortAscending;
                      });
                    },
                  ),
                  PopupMenuButton<String>(
                icon: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.filter_list, size: 18, color: Color(0xFF2563EB)),
                      const SizedBox(width: 4),
                      Text(
                        _priorityFilter == 'all' ? 'All' : _priorityFilter.toUpperCase(),
                        style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                onSelected: (value) {
                  setState(() {
                    _priorityFilter = value;
                  });
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'all', child: Text('All Priority')),
                  const PopupMenuItem(value: 'low', child: Text('Low')),
                  const PopupMenuItem(value: 'medium', child: Text('Medium')),
                  const PopupMenuItem(value: 'high', child: Text('High')),
                  const PopupMenuItem(value: 'critical', child: Text('Critical')),
                ],
              ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        const Text('Assigned to you', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 10),
        Expanded(
          child: FutureBuilder<List<Ticket>>(
            future: dataService.loadTickets(),
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text('Error: ${snapshot.error}'));
              }
              final allTickets = snapshot.data ?? [];
              // Filter for assigned tickets (in-progress or completed)
              var tickets = allTickets.where((t) {
                final isAssigned = t.status.toLowerCase().contains('in-progress') || 
                                 t.status.toLowerCase().contains('completed');
                if (!isAssigned) return false;
                
                if (_priorityFilter == 'all') return true;
                return t.priority.toLowerCase() == _priorityFilter;
              }).toList();
              
              // Sort tickets: in-progress first, then by priority
              tickets.sort((a, b) {
                final aInProgress = a.status.toLowerCase().contains('in-progress');
                final bInProgress = b.status.toLowerCase().contains('in-progress');
                
                // If one is in-progress and the other isn't, prioritize in-progress
                if (aInProgress && !bInProgress) return -1;
                if (!aInProgress && bInProgress) return 1;
                
                // If both have same status, sort by priority
                const priorityOrder = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4};
                final aPriority = priorityOrder[a.priority.toLowerCase()] ?? 0;
                final bPriority = priorityOrder[b.priority.toLowerCase()] ?? 0;
                return _sortAscending ? aPriority.compareTo(bPriority) : bPriority.compareTo(aPriority);
              });
              
              if (tickets.isEmpty) {
                return const Center(child: Text('No assigned tasks', style: TextStyle(color: Colors.grey)));
              }
              
              return ListView.builder(
                itemCount: tickets.length,
                itemBuilder: (context, index) {
                  final t = tickets[index];
                  final customerFuture = dataService.loadCustomerById(t.customerId);
                  return FutureBuilder<Customer?>(
                    future: customerFuture,
                    builder: (context, customerSnapshot) {
                      if (customerSnapshot.connectionState != ConnectionState.done) {
                        return const SizedBox();
                      }
                      final customer = customerSnapshot.data;
                      return _taskCard(context, t, customer);
                    },
                  );
                },
              );
            },
          ),
        ),
      ]),
    );
  }

  Widget _buildProfileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 20),
          const CircleAvatar(
            radius: 60,
            backgroundColor: Color(0xFF2563EB),
            child: Icon(Icons.person, size: 60, color: Colors.white),
          ),
          const SizedBox(height: 16),
          const Text(
            'John Technician',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const Text(
            'Field Technician',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 30),
          _profileCard(
            children: [
              _profileItem(Icons.email, 'Email', 'john.tech@dtg.com'),
              const Divider(height: 1),
              _profileItem(Icons.phone, 'Phone', '+1 234 567 8900'),
              const Divider(height: 1),
              _profileItem(Icons.badge, 'Employee ID', 'TECH-001'),
            ],
          ),
          const SizedBox(height: 16),
          _profileCard(
            children: [
              _profileItem(Icons.assignment_turned_in, 'Completed Tasks', '45'),
              const Divider(height: 1),
              _profileItem(Icons.pending_actions, 'Pending Tasks', '8'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _profileCard({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(children: children),
    );
  }

  Widget _profileItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF2563EB), size: 20),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _ticketCard(BuildContext context, Ticket t, Customer? customer, {bool showStatus = true}) {
    Color statusColor = Colors.grey;
    if (t.status.toLowerCase().contains('in-progress')) statusColor = const Color(0xFF3B82F6);
    if (t.status.toLowerCase().contains('completed')) statusColor = const Color(0xFF10B981);
    
    Color priorityColor = const Color(0xFF6B7280);
    final priority = t.priority.toLowerCase();
    if (priority.contains('low')) priorityColor = const Color(0xFF6B7280);
    if (priority.contains('medium')) priorityColor = const Color(0xFF3B82F6);
    if (priority.contains('high')) priorityColor = const Color(0xFFF59E0B);
    if (priority.contains('critical')) priorityColor = const Color(0xFFDC2626);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 4))
      ]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(t.id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          _chip(t.priorityDisplay, priorityColor),
        ]),
        const SizedBox(height: 10),
        _infoRow('Customer', customer?.name ?? 'N/A'),
        _infoRow('Issue', t.complaint),
        _infoRow('SLA', t.sla),
        const SizedBox(height: 8),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => TicketDetailPage(ticketId: t.id, isFromTasksTab: false)));
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 40),
          ),
          icon: const Icon(Icons.visibility, size: 18),
          label: const Text('View Details'),
        ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                // Accept ticket logic
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              icon: const Icon(Icons.check_circle, size: 18),
              label: const Text('Accept'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                // Reject ticket logic
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              icon: const Icon(Icons.cancel, size: 18),
              label: const Text('Reject'),
            ),
          ),
        ])
      ]),
    );
  }

  Widget _taskCard(BuildContext context, Ticket t, Customer? customer) {
    Color statusColor = const Color(0xFFFBBF24);
    if (t.status.toLowerCase().contains('in-progress')) statusColor = const Color(0xFF3B82F6);
    if (t.status.toLowerCase().contains('completed')) statusColor = const Color(0xFF10B981);
    
    Color priorityColor = const Color(0xFF6B7280);
    final priority = t.priority.toLowerCase();
    if (priority.contains('low')) priorityColor = const Color(0xFF6B7280);
    if (priority.contains('medium')) priorityColor = const Color(0xFF3B82F6);
    if (priority.contains('high')) priorityColor = const Color(0xFFF59E0B);
    if (priority.contains('critical')) priorityColor = const Color(0xFFDC2626);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 4))
      ]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(t.id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          Row(children: [
            _chip(t.statusDisplay, statusColor),
            const SizedBox(width: 6),
            _chip(t.priorityDisplay, priorityColor),
          ])
        ]),
        const SizedBox(height: 10),
        _infoRow('Customer', customer?.name ?? 'N/A'),
        _infoRow('Issue', t.complaint),
        _infoRow('SLA', t.sla),
        const SizedBox(height: 8),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => TicketDetailPage(ticketId: t.id, isFromTasksTab: true)));
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 40),
          ),
          icon: const Icon(Icons.visibility, size: 18),
          label: const Text('View Details'),
        ),
      ]),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        SizedBox(width: 90, child: Text(label, style: const TextStyle(color: Colors.grey))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600))),
      ]),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
    );
  }
}
