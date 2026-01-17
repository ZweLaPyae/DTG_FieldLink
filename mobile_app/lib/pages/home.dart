// lib/home.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models.dart';
import '../data_service.dart';
import '../config/design_tokens.dart';
import '../providers/tickets_provider.dart';
import '../widgets/loading_shimmer.dart';
import 'ticket_detail.dart';
import 'api_test_page.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final DataService dataService = DataService();
  int _currentIndex = 0;
  String _priorityFilter = 'all';
  bool _sortAscending = true; // true = low to critical, false = critical to low

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(ticketsProvider);
    final isSyncing = ticketsAsync.isLoading;
    
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
      backgroundColor: DesignTokens.backgroundColor,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(70),
        child: Container(
          decoration: BoxDecoration(
            gradient: DesignTokens.primaryGradient,
            boxShadow: [DesignTokens.shadowSmall()],
          ),
          child: AppBar(
            elevation: 0,
            backgroundColor: Colors.transparent,
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(DesignTokens.space8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(DesignTokens.radiusMedium),
                  ),
                  child: const Icon(Icons.router, color: Colors.white, size: DesignTokens.iconLarge),
                ),
                const SizedBox(width: DesignTokens.space12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('DTG FieldLink', style: DesignTokens.headingSmall.copyWith(color: Colors.white)),
                    const Text('Fiber Service Management', 
                      style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w400)),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.bug_report, color: Colors.white),
                tooltip: 'API Test',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ApiTestPage()),
                  );
                },
              ),
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
        ),
      ),
      body: bodyContent,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
          child: BottomNavigationBar(
            backgroundColor: Colors.white,
            currentIndex: _currentIndex,
            selectedItemColor: const Color(0xFF1E40AF),
            unselectedItemColor: Colors.grey[400],
            selectedFontSize: 12,
            unselectedFontSize: 11,
            type: BottomNavigationBarType.fixed,
            elevation: 0,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700),
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            items: [
              BottomNavigationBarItem(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _currentIndex == 0 ? const Color(0xFF1E40AF).withOpacity(0.1) : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.confirmation_number_outlined, size: 24),
                ),
                label: 'Tickets',
              ),
              BottomNavigationBarItem(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _currentIndex == 1 ? const Color(0xFF1E40AF).withOpacity(0.1) : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.assignment_outlined, size: 24),
                ),
                label: 'Tasks',
              ),
              BottomNavigationBarItem(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _currentIndex == 2 ? const Color(0xFF1E40AF).withOpacity(0.1) : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.person_outline, size: 24),
                ),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTicketsTab() {
    final ticketsAsync = ref.watch(ticketsProvider);
    
    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true);
      },
      child: Padding(
        padding: const EdgeInsets.all(DesignTokens.space16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            margin: const EdgeInsets.only(bottom: DesignTokens.space10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Available Tickets', style: DesignTokens.headingMedium),
                Row(
                  children: [
                    IconButton(
                      icon: Icon(
                        _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
                        color: DesignTokens.accentBlue,
                      ),
                      onPressed: () {
                        setState(() {
                          _sortAscending = !_sortAscending;
                        });
                      },
                    ),
                    PopupMenuButton<String>(
                  icon: Container(
                    padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space12, vertical: DesignTokens.space6),
                    decoration: BoxDecoration(
                      color: DesignTokens.accentBlue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(DesignTokens.radiusSmall),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.filter_list, size: 18, color: DesignTokens.accentBlue),
                        const SizedBox(width: DesignTokens.space4),
                        Text(
                          _priorityFilter == 'all' ? 'All' : _priorityFilter.toUpperCase(),
                          style: const TextStyle(color: DesignTokens.accentBlue, fontWeight: FontWeight.w600),
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
          const SizedBox(height: DesignTokens.space4),
          const Text('New maintenance requests', style: TextStyle(color: DesignTokens.textLight)),
          const SizedBox(height: DesignTokens.space10),
          Expanded(
            child: ticketsAsync.when(
              data: (allTickets) {
                var tickets = allTickets.where((t) {
                  final isAvailable = !t.status.toLowerCase().contains('in-progress') && 
                                     !t.status.toLowerCase().contains('completed');
                  if (!isAvailable) return false;
                  
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
                  return const Center(
                    child: Text('No available tickets', style: TextStyle(color: DesignTokens.textLight)),
                  );
                }
                
                return ListView.builder(
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    final t = tickets[index];
                    return _ticketCard(context, t, showStatus: false)
                      .animate()
                      .fadeIn(duration: DesignTokens.animationFast, delay: Duration(milliseconds: 50 * index))
                      .slideY(begin: 0.1, end: 0, duration: DesignTokens.animationMedium);
                  },
                );
              },
              loading: () => ListView.builder(
                itemCount: 5,
                itemBuilder: (context, index) => const TicketCardShimmer(),
              ),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 48, color: DesignTokens.errorRed),
                    const SizedBox(height: DesignTokens.space16),
                    Text('Error: $error', style: DesignTokens.bodyMedium),
                    const SizedBox(height: DesignTokens.space16),
                    ElevatedButton(
                      onPressed: () => ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ]),
      ),
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
                  return _taskCard(context, t);
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

  Widget _ticketCard(BuildContext context, Ticket t, {bool showStatus = true}) {
    Color statusColor = Colors.grey;
    if (t.status.toLowerCase().contains('in-progress')) statusColor = const Color(0xFF3B82F6);
    if (t.status.toLowerCase().contains('completed')) statusColor = const Color(0xFF10B981);
    
    Color priorityColor = const Color(0xFF6B7280);
    IconData priorityIcon = Icons.remove;
    final priority = t.priority.toLowerCase();
    if (priority.contains('low')) {
      priorityColor = const Color(0xFF6B7280);
      priorityIcon = Icons.trending_down;
    }
    if (priority.contains('medium')) {
      priorityColor = const Color(0xFF3B82F6);
      priorityIcon = Icons.trending_flat;
    }
    if (priority.contains('high')) {
      priorityColor = const Color(0xFFF59E0B);
      priorityIcon = Icons.trending_up;
    }
    if (priority.contains('critical')) {
      priorityColor = const Color(0xFFDC2626);
      priorityIcon = Icons.warning_amber_rounded;
    }

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TicketDetailPage(ticketId: t.id),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: priorityColor.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
              spreadRadius: 0,
            )
          ],
          border: Border.all(
            color: priorityColor.withOpacity(0.1),
            width: 1,
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [priorityColor.withOpacity(0.05), priorityColor.withOpacity(0.02)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E40AF).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.confirmation_number, color: Color(0xFF1E40AF), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))),
                        const SizedBox(height: 2),
                        Text('Fiber Maintenance', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [priorityColor, priorityColor.withOpacity(0.8)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: priorityColor.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(priorityIcon, color: Colors.white, size: 14),
                  const SizedBox(width: 4),
                  Text(t.priorityDisplay, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                ],
              ),
            ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(Icons.person_outline, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(child: Text(t.customerNameDisplay.isNotEmpty ? t.customerNameDisplay : 'N/A', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Icon(Icons.report_problem_outlined, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(child: Text(t.complaint, style: const TextStyle(fontSize: 13, color: Color(0xFF475569)))),
              ]),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(children: [
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('SLA: ${t.sla}', style: const TextStyle(fontSize: 12, color: Color(0xFF3B82F6), fontWeight: FontWeight.w600)),
                    ),
                  ]),
                  // Accept button at same level
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF059669)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF10B981).withOpacity(0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () async {
                          // Accept ticket - update status to in-progress
                          final success = await dataService.updateTicket(t.id, {
                            'status': 'IN_PROGRESS',
                          });
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Ticket accepted! Check Tasks tab.')),
                            );
                            setState(() {
                              // Refresh the list
                            });
                          } else if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed to accept ticket')),
                            );
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: const Icon(
                          Icons.check_circle,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        )
      ]),
      ),
    );
  }

  Widget _taskCard(BuildContext context, Ticket t) {
    Color statusColor = const Color(0xFFFBBF24);
    IconData statusIcon = Icons.pending_actions;
    if (t.status.toLowerCase().contains('in-progress')) {
      statusColor = const Color(0xFF3B82F6);
      statusIcon = Icons.loop;
    }
    if (t.status.toLowerCase().contains('completed')) {
      statusColor = const Color(0xFF10B981);
      statusIcon = Icons.check_circle;
    }
    
    Color priorityColor = const Color(0xFF6B7280);
    IconData priorityIcon = Icons.remove;
    final priority = t.priority.toLowerCase();
    if (priority.contains('low')) {
      priorityColor = const Color(0xFF6B7280);
      priorityIcon = Icons.trending_down;
    }
    if (priority.contains('medium')) {
      priorityColor = const Color(0xFF3B82F6);
      priorityIcon = Icons.trending_flat;
    }
    if (priority.contains('high')) {
      priorityColor = const Color(0xFFF59E0B);
      priorityIcon = Icons.trending_up;
    }
    if (priority.contains('critical')) {
      priorityColor = const Color(0xFFDC2626);
      priorityIcon = Icons.warning_amber_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.white, statusColor.withOpacity(0.03)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: statusColor.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          )
        ],
        border: Border.all(
          color: statusColor.withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [statusColor.withOpacity(0.2), statusColor.withOpacity(0.1)],
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(statusIcon, color: statusColor, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t.id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  t.statusDisplay,
                                  style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [priorityColor, priorityColor.withOpacity(0.8)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: priorityColor.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(priorityIcon, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(t.priorityDisplay, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(children: [
                Icon(Icons.person_outline, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(child: Text(t.customerNameDisplay.isNotEmpty ? t.customerNameDisplay : 'N/A', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Icon(Icons.report_problem_outlined, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(child: Text(t.complaint, style: const TextStyle(fontSize: 13, color: Color(0xFF475569)))),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('SLA: ${t.sla}', style: const TextStyle(fontSize: 12, color: Color(0xFF3B82F6), fontWeight: FontWeight.w600)),
                ),
              ]),
              const SizedBox(height: 18),
              // Large CTA: Continue/Complete Job
              Container(
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: t.status.toLowerCase().contains('completed')
                        ? [const Color(0xFF10B981), const Color(0xFF059669)]
                        : [const Color(0xFF3B82F6), const Color(0xFF1E40AF)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: statusColor.withOpacity(0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => TicketDetailPage(ticketId: t.id, isFromTasksTab: true)));
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            t.status.toLowerCase().contains('completed')
                                ? Icons.check_circle
                                : Icons.build,
                            size: 24,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            t.status.toLowerCase().contains('completed')
                                ? 'VIEW COMPLETED'
                                : 'CONTINUE WORK',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Quick Actions
              Row(children: [
                Expanded(
                  child: _quickActionButton(
                    icon: Icons.call,
                    label: 'Call',
                    color: const Color(0xFF10B981),
                    onTap: () {
                      // TODO: Implement call customer
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _quickActionButton(
                    icon: Icons.navigation,
                    label: 'Navigate',
                    color: const Color(0xFF3B82F6),
                    onTap: () {
                      // TODO: Implement navigation
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _quickActionButton(
                    icon: Icons.camera_alt,
                    label: 'Photo',
                    color: const Color(0xFFF59E0B),
                    onTap: () {
                      // TODO: Implement photo capture
                    },
                  ),
                ),
              ]),
            ],
          ),
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

  Widget _quickActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color, width: 2),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
