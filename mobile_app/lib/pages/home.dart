// lib/home.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models.dart';
import '../data_service.dart';
import '../config/design_tokens.dart';
import '../providers/tickets_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/loading_shimmer.dart';
import '../widgets/primary_button.dart';
import 'ticket_detail.dart';
import 'api_test_page.dart';
import 'login_page.dart';

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
  bool _inProgressExpanded = true;  // Expanded by default
  bool _inReviewExpanded = true;
  bool _completedExpanded = false;  // Not expanded by default
  Map<String, dynamic>? _currentTeam; // Store current technician's team
  bool _teamLoaded = false; // Track if team has been loaded
  String? _lastTechnicianId; // Track last technician to avoid reloading

  Future<void> _loadTeamData(String technicianId) async {
    // Avoid reloading if already loaded for this technician
    if (_teamLoaded && _lastTechnicianId == technicianId) {
      return;
    }
    
    try {
      print('Loading team data for technician: $technicianId');
      final teamData = await dataService.getTeamForTechnician(int.parse(technicianId));
      if (mounted) {
        setState(() {
          _currentTeam = teamData;
          _teamLoaded = true;
          _lastTechnicianId = technicianId;
        });
        print('Loaded team for technician $technicianId: ${teamData?['name']}');
        print('Team ID: ${teamData?['id']}');
        print('Team role: ${teamData?['role']}');
      }
    } catch (e) {
      print('Error loading team: $e');
      if (mounted) {
        setState(() {
          _teamLoaded = true;
          _lastTechnicianId = technicianId;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(ticketsProvider);
    final isSyncing = ticketsAsync.isLoading;
    final authState = ref.watch(authProvider);
    final currentTechnician = authState.technician;
    
    // Load team data when we have a technician
    if (currentTechnician != null && !_teamLoaded) {
      _loadTeamData(currentTechnician.id);
    }
    
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
                  // Available tickets: status must be NEW and no technician assigned
                  final hasNoTechnician = t.technicianId == null || t.technicianId!.isEmpty;
                  final isNew = t.status.toUpperCase() == 'NEW';
                  
                  final isAvailable = hasNoTechnician && isNew;
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
          child: Consumer(
            builder: (context, ref, child) {
              final ticketsAsync = ref.watch(ticketsProvider);
              final authState = ref.watch(authProvider);
              final currentTechnician = authState.technician;
              
              return ticketsAsync.when(
                data: (allTickets) {
                  print('Total tickets: ${allTickets.length}');
                  print('Current technician ID: ${currentTechnician?.id}');
                  print('Current team ID: ${_currentTeam?['id']}');
                  print('Team loaded: $_teamLoaded');
                  
                  // Filter for assigned tickets: status NOT NEW and team matches
                  var tickets = allTickets.where((t) {
                    print('--- Checking ticket ${t.id} ---');
                    print('  Status: ${t.status}');
                    print('  Ticket TeamId: ${t.teamId}');
                    
                    // Check if ticket status is NOT NEW (any other status means assigned)
                    final isNotNew = t.status.toUpperCase() != 'NEW';
                    print('  Is not new status: $isNotNew');
                    if (!isNotNew) {
                      print('  REJECTED: Status is NEW');
                      return false;
                    }
                    
                    // Check if technician is logged in
                    if (currentTechnician == null) {
                      print('  REJECTED: No current technician');
                      return false;
                    }
                    
                    // Check if ticket has a team assigned
                    if (t.teamId == null) {
                      print('  REJECTED: Ticket has no team');
                      return false;
                    }
                    
                    // Check if current technician is part of the ticket's team
                    // Compare ticket's teamId with current technician's team id
                    bool isInTeam = false;
                    if (_currentTeam != null && _currentTeam!['id'] != null) {
                      final ticketTeamId = t.teamId.toString();
                      final currentTeamId = _currentTeam!['id'].toString();
                      isInTeam = ticketTeamId == currentTeamId;
                      print('  Ticket team: $ticketTeamId, Current team: $currentTeamId');
                      print('  Is in team: $isInTeam');
                    } else {
                      print('  Current technician has no team');
                    }
                    
                    if (!isInTeam) {
                      print('  REJECTED: Technician not in ticket\'s team');
                      return false;
                    }
                    
                    if (_priorityFilter == 'all') {
                      print('  ACCEPTED: All priority filter');
                      return true;
                    }
                    
                    final priorityMatch = t.priority.toLowerCase() == _priorityFilter;
                    print('  Priority match: $priorityMatch (${t.priority.toLowerCase()} == $_priorityFilter)');
                    return priorityMatch;
                  }).toList();
                  
                  print('Filtered tickets for tasks tab: ${tickets.length}');
                  
                  // Group tickets by status
                  final inProgressTickets = tickets.where((t) => t.status.toUpperCase() == 'IN_PROGRESS').toList();
                  final inReviewTickets = tickets.where((t) => t.status.toUpperCase() == 'IN_REVIEW').toList();
                  final completedTickets = tickets.where((t) => t.status.toUpperCase() == 'COMPLETED').toList();
                  
                  if (tickets.isEmpty) {
                    return const Center(child: Text('No assigned tasks', style: TextStyle(color: Colors.grey)));
                  }
                  
                  return ListView(
                    children: [
                      // In Progress Section
                      if (inProgressTickets.isNotEmpty) ...[
                        _statusSection(
                          'In Progress',
                          inProgressTickets.length,
                          const Color(0xFF3B82F6),
                          Icons.autorenew,
                          _inProgressExpanded,
                          () => setState(() => _inProgressExpanded = !_inProgressExpanded),
                        ),
                        if (_inProgressExpanded)
                          ...inProgressTickets.map((t) => _taskCard(context, t, const Color(0xFF3B82F6))),
                      ],
                      // In Review Section
                      if (inReviewTickets.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _statusSection(
                          'In Review',
                          inReviewTickets.length,
                          const Color(0xFFF59E0B),
                          Icons.rate_review,
                          _inReviewExpanded,
                          () => setState(() => _inReviewExpanded = !_inReviewExpanded),
                        ),
                        if (_inReviewExpanded)
                          ...inReviewTickets.map((t) => _taskCard(context, t, const Color(0xFFF59E0B))),
                      ],
                      // Completed Section
                      if (completedTickets.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _statusSection(
                          'Completed',
                          completedTickets.length,
                          const Color(0xFF10B981),
                          Icons.check_circle,
                          _completedExpanded,
                          () => setState(() => _completedExpanded = !_completedExpanded),
                        ),
                        if (_completedExpanded)
                          ...completedTickets.map((t) => _taskCard(context, t, const Color(0xFF10B981))),
                      ],
                    ],
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error: $error'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }

  Widget _buildProfileTab() {
    final authState = ref.watch(authProvider);
    final technician = authState.technician;

    // If no technician is logged in, show error
    if (technician == null) {
      return const Center(
        child: Text('No technician data available'),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Profile Picture with Edit Icon
          Stack(
            children: [
              CircleAvatar(
                radius: 60,
                backgroundColor: const Color(0xFF2563EB),
                backgroundImage: technician.picture.isNotEmpty
                    ? NetworkImage(technician.picture)
                    : null,
                child: technician.picture.isEmpty
                    ? const Icon(Icons.person, size: 60, color: Colors.white)
                    : null,
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.edit,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Technician Name
          Text(
            technician.name,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const Text(
            'Field Technician',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 30),
          // Contact Information Card
          _profileCard(
            children: [
              _profileItem(Icons.email, 'Email', technician.email),
              const Divider(height: 1),
              _profileItem(Icons.phone, 'Phone', technician.phone),
              const Divider(height: 1),
              _profileItem(Icons.badge, 'Employee ID', 'TECH-${technician.id}'),
              const Divider(height: 1),
              // Team information - fetch from API
              FutureBuilder<Map<String, dynamic>?>(
                future: dataService.getTeamForTechnician(int.parse(technician.id)),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return _profileItem(Icons.groups, 'Team', 'Loading...');
                  } else if (snapshot.hasData && snapshot.data != null) {
                    final teamData = snapshot.data!;
                    final teamName = teamData['name'] ?? 'Unknown Team';
                    final role = teamData['role'] ?? 'Member';
                    
                    return Column(
                      children: [
                        _profileItem(Icons.groups, 'Team', teamName),
                        const Divider(height: 1),
                        _profileItem(Icons.workspace_premium, 'Role in Team', role),
                      ],
                    );
                  } else {
                    return Column(
                      children: [
                        _profileItem(Icons.groups, 'Team', 'No Team Yet'),
                        const Divider(height: 1),
                        _profileItem(Icons.workspace_premium, 'Role in Team', '-'),
                      ],
                    );
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Statistics Card
          Consumer(
            builder: (context, ref, _) {
              final ticketsAsync = ref.watch(ticketsProvider);
              
              return ticketsAsync.when(
                data: (tickets) {
                  // Filter tickets by team membership, not individual technician
                  final myTeamTickets = tickets.where((t) {
                    if (_currentTeam == null || _currentTeam!['id'] == null) return false;
                    if (t.teamId == null) return false;
                    return t.teamId.toString() == _currentTeam!['id'].toString();
                  }).toList();
                  
                  final completedCount = myTeamTickets.where((t) => 
                    t.status.toUpperCase() == 'COMPLETED'
                  ).length;
                  
                  final pendingCount = myTeamTickets.where((t) => 
                    t.status.toUpperCase() != 'COMPLETED' && t.status.toUpperCase() != 'NEW'
                  ).length;
                  
                  final totalTickets = completedCount + pendingCount;
                  
                  return _profileCard(
                    children: [
                      _profileItem(
                        Icons.assignment_turned_in,
                        'Total Tickets',
                        totalTickets.toString(),
                      ),
                      const Divider(height: 1),
                      _profileItem(
                        Icons.check_circle,
                        'Completed Tickets',
                        completedCount.toString(),
                      ),
                      const Divider(height: 1),
                      _profileItem(
                        Icons.pending_actions,
                        'Pending Tickets',
                        pendingCount.toString(),
                      ),
                    ],
                  );
                },
                loading: () => _profileCard(
                  children: [
                    _profileItem(
                      Icons.assignment_turned_in,
                      'Total Tickets',
                      technician.ticketCount?.toString() ?? '0',
                    ),
                    const Divider(height: 1),
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                  ],
                ),
                error: (_, __) => _profileCard(
                  children: [
                    _profileItem(
                      Icons.assignment_turned_in,
                      'Total Tickets',
                      technician.ticketCount?.toString() ?? '0',
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          // Logout Button
          ElevatedButton.icon(
            onPressed: () {
              // Show confirmation dialog
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        ref.read(authProvider.notifier).logout();
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(builder: (_) => const LoginPage()),
                          (route) => false,
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
            },
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
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
              const SizedBox(height: 6),
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
                  // Accept button using primary button component
                  PrimaryButton(
                    text: 'Accept',
                    variant: ButtonVariant.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    onPressed: () async {
                      final authState = ref.read(authProvider);
                      final currentTechnician = authState.technician;
                      
                      if (currentTechnician == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Error: No technician logged in')),
                        );
                        return;
                      }
                      
                      // Accept ticket - update status, teamId, and startTime
                      try {
                        final techId = int.parse(currentTechnician.id);
                        print('Accepting ticket ${t.id} for technician $techId');
                        
                        // Get the team ID for this technician
                        int? teamId;
                        if (_currentTeam != null && _currentTeam!['id'] != null) {
                          teamId = _currentTeam!['id'] as int;
                          print('Assigning ticket to team: $teamId');
                        } else {
                          print('WARNING: Technician has no team!');
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('You must be assigned to a team to accept tickets')),
                            );
                          }
                          return;
                        }
                        
                        final success = await dataService.updateTicket(t.id, {
                          'status': 'IN_PROGRESS',
                          'teamId': teamId,
                          'startTime': DateTime.now().toIso8601String(),
                        });
                        if (success && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Ticket accepted! Check Tasks tab.')),
                          );
                          // Refresh tickets
                          ref.invalidate(ticketsProvider);
                        } else if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Failed to accept ticket')),
                          );
                        }
                      } catch (e) {
                        print('Error accepting ticket: $e');
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        }
                      }
                    },
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

  Widget _taskCard(BuildContext context, Ticket t, Color statusColor) {
    IconData statusIcon = Icons.pending_actions;
    if (t.status.toUpperCase() == 'IN_PROGRESS') {
      statusIcon = Icons.autorenew;
    }
    if (t.status.toUpperCase() == 'IN_REVIEW') {
      statusIcon = Icons.rate_review;
    }
    if (t.status.toUpperCase() == 'COMPLETED') {
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

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TicketDetailPage(ticketId: t.id, isFromTasksTab: true),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
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
            ],
          ),
        ),
      ]),
      ),
    );
  }

  Widget _statusSection(String title, int count, Color color, IconData icon, bool isExpanded, VoidCallback onToggle) {
    return InkWell(
      onTap: onToggle,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withOpacity(0.15), color.withOpacity(0.05)],
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3), width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                count.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isExpanded ? Icons.expand_less : Icons.expand_more,
              color: color,
            ),
          ],
        ),
      ),
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
