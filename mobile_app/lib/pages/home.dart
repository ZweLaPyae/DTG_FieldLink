// lib/home.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import '../models.dart';
import '../data_service.dart';
import '../config/design_tokens.dart';
import '../providers/tickets_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/loading_shimmer.dart';
import '../widgets/primary_button.dart';
import '../services/spaces_upload_service.dart';
import '../services/firebase_auth_service.dart';
import '../services/notification_service.dart';
import 'ticket_detail.dart';
import 'api_test_page.dart';
import 'login_page.dart';
import 'notifications_page.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> with SingleTickerProviderStateMixin {
  final DataService dataService = DataService();
  final FirebaseAuthService _authService = FirebaseAuthService();
  int _currentIndex = 0;
  String _priorityFilter = 'all';
  bool _sortAscending = true; // true = oldest to newest, false = newest to oldest
  late TabController _tabController;
  List<Map<String, dynamic>> _currentTeams = []; // Store current technician's teams
  bool _teamLoaded = false; // Track if teams have been loaded
  String? _lastTechnicianId; // Track last technician to avoid reloading
  int _notificationCount = 0; // Track notification count for badge
  
  // Store callback reference so we can remove it in dispose
  late final Function() _notificationCallback;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      // Rebuild when tab changes to update badge colors
      if (mounted) setState(() {});
    });
    
    // Load initial notification count
    _loadNotificationCount();
    
    // Create callback reference
    _notificationCallback = () {
      print('🔔 Notification received in HomePage, refreshing...');
      _loadNotificationCount();
      // Refresh current tab data
      _refreshCurrentTab();
    };
    
    // Register callback to refresh when notification arrives
    addNotificationListener(_notificationCallback);
  }

  @override
  void dispose() {
    removeNotificationListener(_notificationCallback);
    _tabController.dispose();
    super.dispose();
  }
  
  Future<void> _loadNotificationCount() async {
    final authState = ref.read(authProvider);
    final technicianId = authState.technician?.id;
    
    if (technicianId == null) return;
    
    try {
      final data = await dataService.loadNotifications(int.parse(technicianId));
      if (mounted) {
        setState(() {
          _notificationCount = data['unreadCount'] ?? 0;
        });
      }
    } catch (e) {
      print('Error loading notification count: $e');
    }
  }
  
  Future<void> _refreshCurrentTab() async {
    if (!mounted) return;
    
    if (_currentIndex == 0) {
      // Refresh tickets tab
      await ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true);
    } else if (_currentIndex == 1) {
      // Refresh tasks tab
      await ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true);
    }
    // Profile tab doesn't need auto-refresh
  }

  Future<void> _loadTeamData(String technicianId) async {
    // Avoid reloading if already loaded for this technician
    if (_teamLoaded && _lastTechnicianId == technicianId) {
      return;
    }

    try {
      print('Loading teams data for technician: $technicianId');
      final teamsData = await dataService.getTeamsForTechnician(
        int.parse(technicianId),
      );
      if (mounted) {
        setState(() {
          _currentTeams = teamsData;
          _teamLoaded = true;
          _lastTechnicianId = technicianId;
        });
        print('Loaded ${teamsData.length} teams for technician $technicianId');
        for (var team in teamsData) {
          print('  - Team: ${team['name']} (ID: ${team['id']}, Role: ${team['role']})');
        }
      }
    } catch (e) {
      print('Error loading teams: $e');
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
                    borderRadius: BorderRadius.circular(
                      DesignTokens.radiusMedium,
                    ),
                  ),
                  child: const Icon(
                    Icons.router,
                    color: Colors.white,
                    size: DesignTokens.iconLarge,
                  ),
                ),
                const SizedBox(width: DesignTokens.space12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'DTG FieldLink',
                      style: DesignTokens.headingSmall.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    const Text(
                      'Fiber Service Management',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              // Notification Bell with Badge
              IconButton(
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.notifications, color: Colors.white, size: 28),
                    if (_notificationCount > 0)
                      Positioned(
                        right: -2,
                        top: -2,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF1976D2), width: 2),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 20,
                            minHeight: 20,
                          ),
                          child: Center(
                            child: Text(
                              _notificationCount > 99 ? '99+' : '$_notificationCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                tooltip: 'Notifications',
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const NotificationsPage(),
                    ),
                  );
                  // Reload count after returning from notifications page
                  _loadNotificationCount();
                },
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.menu, color: Colors.white),
                onSelected: (value) async {
                  if (value == 'logout') {
                    // Handle logout
                    await _authService.signOut();
                    ref.read(authProvider.notifier).logout();
                    if (context.mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const LoginPage()),
                        (route) => false,
                      );
                    }
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
                    color: _currentIndex == 0
                        ? const Color(0xFF1E40AF).withOpacity(0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.confirmation_number_outlined,
                    size: 24,
                  ),
                ),
                label: 'Tickets',
              ),
              BottomNavigationBarItem(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _currentIndex == 1
                        ? const Color(0xFF1E40AF).withOpacity(0.1)
                        : Colors.transparent,
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
                    color: _currentIndex == 2
                        ? const Color(0xFF1E40AF).withOpacity(0.1)
                        : Colors.transparent,
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
        await ref
            .read(ticketsProvider.notifier)
            .loadTickets(forceRefresh: true);
      },
      child: Padding(
        padding: const EdgeInsets.all(DesignTokens.space16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                          _sortAscending
                              ? Icons.arrow_upward
                              : Icons.arrow_downward,
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
                          padding: const EdgeInsets.symmetric(
                            horizontal: DesignTokens.space12,
                            vertical: DesignTokens.space6,
                          ),
                          decoration: BoxDecoration(
                            color: DesignTokens.accentBlue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(
                              DesignTokens.radiusSmall,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.filter_list,
                                size: 18,
                                color: DesignTokens.accentBlue,
                              ),
                              const SizedBox(width: DesignTokens.space4),
                              Text(
                                _priorityFilter == 'all'
                                    ? 'All'
                                    : _priorityFilter.toUpperCase(),
                                style: const TextStyle(
                                  color: DesignTokens.accentBlue,
                                  fontWeight: FontWeight.w600,
                                ),
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
                          const PopupMenuItem(
                            value: 'all',
                            child: Text('All Priority'),
                          ),
                          const PopupMenuItem(
                            value: 'normal',
                            child: Text('Normal'),
                          ),
                          const PopupMenuItem(
                            value: 'urgent',
                            child: Text('Urgent'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: DesignTokens.space4),
            const Text(
              'New maintenance requests',
              style: TextStyle(color: DesignTokens.textLight),
            ),
            const SizedBox(height: DesignTokens.space10),
            Expanded(
              child: ticketsAsync.when(
                data: (allTickets) {
                  var tickets = allTickets.where((t) {
                    // Available tickets: status must be NEW and no technician assigned
                    final hasNoTechnician =
                        t.technicianId == null || t.technicianId!.isEmpty;
                    final isNew = t.status.toUpperCase() == 'NEW';

                    final isAvailable = hasNoTechnician && isNew;
                    if (!isAvailable) return false;

                    if (_priorityFilter == 'all') return true;
                    return t.priority.toLowerCase() == _priorityFilter;
                  }).toList();

                  // Sort tickets by priority
                  tickets.sort((a, b) {
                    const priorityOrder = {'normal': 1, 'urgent': 2};
                    final aPriority =
                        priorityOrder[a.priority.toLowerCase()] ?? 0;
                    final bPriority =
                        priorityOrder[b.priority.toLowerCase()] ?? 0;
                    return _sortAscending
                        ? aPriority.compareTo(bPriority)
                        : bPriority.compareTo(aPriority);
                  });

                  if (tickets.isEmpty) {
                    return const Center(
                      child: Text(
                        'No available tickets',
                        style: TextStyle(color: DesignTokens.textLight),
                      ),
                    );
                  }

                  return ListView.builder(
                    itemCount: tickets.length,
                    itemBuilder: (context, index) {
                      final t = tickets[index];
                      return _ticketCard(context, t, showStatus: false)
                          .animate()
                          .fadeIn(
                            duration: DesignTokens.animationFast,
                            delay: Duration(milliseconds: 50 * index),
                          )
                          .slideY(
                            begin: 0.1,
                            end: 0,
                            duration: DesignTokens.animationMedium,
                          );
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
                      Icon(
                        Icons.error_outline,
                        size: 48,
                        color: DesignTokens.errorRed,
                      ),
                      const SizedBox(height: DesignTokens.space16),
                      Text('Error: $error', style: DesignTokens.bodyMedium),
                      const SizedBox(height: DesignTokens.space16),
                      ElevatedButton(
                        onPressed: () => ref
                            .read(ticketsProvider.notifier)
                            .loadTickets(forceRefresh: true),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTasksTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await ref
            .read(ticketsProvider.notifier)
            .loadTickets(forceRefresh: true);
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
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
                      _sortAscending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.filter_list,
                            size: 18,
                            color: Color(0xFF2563EB),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _priorityFilter == 'all'
                                ? 'All'
                                : _priorityFilter.toUpperCase(),
                            style: const TextStyle(
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.w600,
                            ),
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
                      const PopupMenuItem(
                        value: 'all',
                        child: Text('All Priority'),
                      ),
                      const PopupMenuItem(
                        value: 'normal',
                        child: Text('Normal'),
                      ),
                      const PopupMenuItem(
                        value: 'urgent',
                        child: Text('Urgent'),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text('Assigned to you', style: TextStyle(color: Colors.grey)),
        ),
        const SizedBox(height: 12),
        // TabBar with Badge Counts
        Consumer(
          builder: (context, ref, child) {
            final ticketsAsync = ref.watch(ticketsProvider);
            final authState = ref.watch(authProvider);
            final currentTechnician = authState.technician;

            return ticketsAsync.when(
              data: (allTickets) {
                // Filter tickets for current user
                var tickets = allTickets.where((t) {
                  final isNotNew = t.status.toUpperCase() != 'NEW';
                  if (!isNotNew) return false;
                  if (currentTechnician == null) return false;
                  if (t.teamId == null) return false;

                  bool isInAnyTeam = false;
                  if (_currentTeams.isNotEmpty) {
                    final ticketTeamId = t.teamId.toString();
                    final memberTeamIds = _currentTeams
                        .where((team) => team['id'] != null)
                        .map((team) => team['id'].toString())
                        .toList();
                    isInAnyTeam = memberTeamIds.contains(ticketTeamId);
                  }

                  if (!isInAnyTeam) return false;
                  if (_priorityFilter == 'all') return true;
                  return t.priority.toLowerCase() == _priorityFilter;
                }).toList();

                final inProgressCount = tickets
                    .where((t) => t.status.toUpperCase() == 'IN_PROGRESS')
                    .length;
                final inReviewCount = tickets
                    .where((t) => t.status.toUpperCase() == 'IN_REVIEW')
                    .length;
                final completedCount = tickets
                    .where((t) => t.status.toUpperCase() == 'COMPLETED')
                    .length;

                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!, width: 1),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicator: BoxDecoration(
                      color: const Color(0xFF2563EB),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2563EB).withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.black87,
                    labelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    tabs: [
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('In Progress'),
                            if (inProgressCount > 0) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 0
                                      ? Colors.white.withOpacity(0.3)
                                      : const Color(0xFF3B82F6),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '$inProgressCount',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _tabController.index == 0
                                        ? Colors.white
                                        : Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('In Review'),
                            if (inReviewCount > 0) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 1
                                      ? Colors.white.withOpacity(0.3)
                                      : const Color(0xFFF59E0B),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '$inReviewCount',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _tabController.index == 1
                                        ? Colors.white
                                        : Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('Complete'),
                            if (completedCount > 0) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 2
                                      ? Colors.white.withOpacity(0.3)
                                      : const Color(0xFF10B981),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '$completedCount',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _tabController.index == 2
                                        ? Colors.white
                                        : Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
              loading: () => Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        // TabBarView
        Expanded(
          child: Consumer(
            builder: (context, ref, child) {
              final ticketsAsync = ref.watch(ticketsProvider);
              final authState = ref.watch(authProvider);
              final currentTechnician = authState.technician;

              return ticketsAsync.when(
                data: (allTickets) {
                  // Filter for assigned tickets: status NOT NEW and team matches
                  var tickets = allTickets.where((t) {
                    // Check if ticket status is NOT NEW (any other status means assigned)
                    final isNotNew = t.status.toUpperCase() != 'NEW';
                    if (!isNotNew) return false;

                    // Check if technician is logged in
                    if (currentTechnician == null) return false;

                    // Check if ticket has a team assigned
                    if (t.teamId == null) return false;

                    // Check if current technician is part of ANY team that has this ticket
                    bool isInAnyTeam = false;
                    if (_currentTeams.isNotEmpty) {
                      final ticketTeamId = t.teamId.toString();
                      final memberTeamIds = _currentTeams
                          .where((team) => team['id'] != null)
                          .map((team) => team['id'].toString())
                          .toList();
                      isInAnyTeam = memberTeamIds.contains(ticketTeamId);
                    }

                    if (!isInAnyTeam) return false;

                    if (_priorityFilter == 'all') return true;

                    return t.priority.toLowerCase() == _priorityFilter;
                  }).toList();

                  // Sort tickets by issue time
                  tickets.sort((a, b) {
                    if (a.issueTime == null && b.issueTime == null) return 0;
                    if (a.issueTime == null) return 1;
                    if (b.issueTime == null) return -1;
                    return _sortAscending
                        ? a.issueTime!.compareTo(b.issueTime!)
                        : b.issueTime!.compareTo(a.issueTime!);
                  });

                  // Group tickets by status
                  final inProgressTickets = tickets
                      .where((t) => t.status.toUpperCase() == 'IN_PROGRESS')
                      .toList();
                  final inReviewTickets = tickets
                      .where((t) => t.status.toUpperCase() == 'IN_REVIEW')
                      .toList();
                  final completedTickets = tickets
                      .where((t) => t.status.toUpperCase() == 'COMPLETED')
                      .toList();

                  return TabBarView(
                    controller: _tabController,
                    children: [
                      // In Progress Tab
                      _buildTicketList(
                        inProgressTickets,
                        const Color(0xFF3B82F6),
                        'No in-progress tasks',
                      ),
                      // In Review Tab
                      _buildTicketList(
                        inReviewTickets,
                        const Color(0xFFF59E0B),
                        'No tasks in review',
                      ),
                      // Completed Tab
                      _buildTicketList(
                        completedTickets,
                        const Color(0xFF10B981),
                        'No completed tasks',
                      ),
                    ],
                  );
                },
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      Text('Error: $error'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref
                            .read(ticketsProvider.notifier)
                            .loadTickets(forceRefresh: true),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    ),
    );
  }

  Widget _buildTicketList(List<Ticket> tickets, Color color, String emptyMessage) {
    if (tickets.isEmpty) {
      return Center(
        child: Text(
          emptyMessage,
          style: const TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: tickets.length,
      itemBuilder: (context, index) {
        return _taskCard(context, tickets[index], color);
      },
    );
  }

  Widget _buildProfileTab() {
    final authState = ref.watch(authProvider);
    final technician = authState.technician;

    // If no technician is logged in, show error
    if (technician == null) {
      return const Center(child: Text('No technician data available'));
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(authProvider.notifier).refreshTechnician();
        await ref.read(ticketsProvider.notifier).loadTickets(forceRefresh: true);
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
        children: [
          const SizedBox(height: 20),
          // Profile Picture with Edit Icon
          GestureDetector(
            onTap: () async {
              // Show options to upload new photo
              showModalBottomSheet(
                context: context,
                builder: (context) => Container(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Update Profile Picture',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ListTile(
                        leading: const Icon(Icons.photo_library),
                        title: const Text('Choose from gallery'),
                        onTap: () async {
                          Navigator.pop(context);
                          try {
                            final picker = ImagePicker();
                            final pickedFile = await picker.pickImage(
                              source: ImageSource.gallery,
                            );

                            if (pickedFile == null) return;

                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Uploading profile picture...'),
                                ),
                              );
                            }

                            // Upload to DO Spaces (technicians folder)
                            final spacesService = SpacesUploadService();
                            final file = File(pickedFile.path);
                            final cdnUrl = await spacesService
                                .uploadTechnicianProfile(file, technician.id);

                            // Update technician profile
                            await dataService.updateTechnician(
                              int.parse(technician.id),
                              {'picture': cdnUrl},
                            );

                            // Refresh auth state
                            ref.read(authProvider.notifier).refreshTechnician();

                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Profile picture updated successfully',
                                  ),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Error updating profile picture: $e',
                                  ),
                                ),
                              );
                            }
                          }
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.camera_alt),
                        title: const Text('Take a photo'),
                        onTap: () async {
                          Navigator.pop(context);
                          try {
                            final picker = ImagePicker();
                            final pickedFile = await picker.pickImage(
                              source: ImageSource.camera,
                            );

                            if (pickedFile == null) return;

                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Uploading profile picture...'),
                                ),
                              );
                            }

                            final spacesService = SpacesUploadService();
                            final file = File(pickedFile.path);
                            final cdnUrl = await spacesService
                                .uploadTechnicianProfile(file, technician.id);

                            await dataService.updateTechnician(
                              int.parse(technician.id),
                              {'picture': cdnUrl},
                            );
                            ref.read(authProvider.notifier).refreshTechnician();

                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Profile picture updated successfully',
                                  ),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Error updating profile picture: $e',
                                  ),
                                ),
                              );
                            }
                          }
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
            child: Stack(
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
              _profileItemEditable(
                Icons.phone,
                'Phone',
                technician.phone.isEmpty
                    ? 'No phone numbers'
                    : technician.phone.length == 1
                    ? technician.phone.first
                    : '${technician.phone.first} (+${technician.phone.length - 1} more)',
                onTap: () {
                  // Show dialog to manage phone numbers
                  showDialog(
                    context: context,
                    builder: (context) => _PhoneManagementDialog(
                      technicianId: int.parse(technician.id),
                      initialPhones: List<String>.from(technician.phone),
                      onUpdate: () {
                        ref.read(authProvider.notifier).refreshTechnician();
                      },
                    ),
                  );
                },
              ),
              const Divider(height: 1),
              _profileItemEditable(
                Icons.lock,
                'Password',
                '••••••••',
                onTap: () {
                  // Show dialog to change password
                  final currentPasswordController = TextEditingController();
                  final newPasswordController = TextEditingController();
                  final confirmPasswordController = TextEditingController();
                  showDialog(
                    context: context,
                    builder: (dialogContext) => AlertDialog(
                      title: const Text('Change Password'),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextField(
                            controller: currentPasswordController,
                            decoration: const InputDecoration(
                              labelText: 'Current Password',
                              border: OutlineInputBorder(),
                            ),
                            obscureText: true,
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: newPasswordController,
                            decoration: const InputDecoration(
                              labelText: 'New Password',
                              border: OutlineInputBorder(),
                            ),
                            obscureText: true,
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: confirmPasswordController,
                            decoration: const InputDecoration(
                              labelText: 'Confirm New Password',
                              border: OutlineInputBorder(),
                            ),
                            obscureText: true,
                          ),
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(dialogContext),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          onPressed: () async {
                            if (newPasswordController.text !=
                                confirmPasswordController.text) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Passwords do not match'),
                                  ),
                                );
                              }
                              return;
                            }

                            if (newPasswordController.text.length < 6) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'New password must be at least 6 characters',
                                    ),
                                  ),
                                );
                              }
                              return;
                            }

                            try {
                              print('Attempting password change...');
                              print('Technician ID: ${technician.id}');
                              print(
                                'Current password length: ${currentPasswordController.text.length}',
                              );
                              print(
                                'New password length: ${newPasswordController.text.length}',
                              );

                              // Step 1: Update password in backend database
                              await dataService.updateTechnicianPassword(
                                int.parse(technician.id),
                                currentPasswordController.text,
                                newPasswordController.text,
                              );
                              print('Backend password updated successfully');

                              // Step 2: Update Firebase Auth password
                              try {
                                await _authService.updatePassword(
                                  newPasswordController.text,
                                );
                                print(
                                  'Firebase Auth password updated successfully',
                                );
                              } catch (firebaseError) {
                                print(
                                  'Firebase password update error: $firebaseError',
                                );
                                // If Firebase update fails, we still show success since backend was updated
                                // User can sign in again to sync
                              }

                              print('Password change successful - logging out');

                              if (dialogContext.mounted) {
                                Navigator.pop(dialogContext);
                              }

                              // Step 3: Logout user so they must login with new password
                              await _authService.signOut();
                              ref.read(authProvider.notifier).logout();

                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Password changed! Please login with your new password.',
                                    ),
                                    backgroundColor: Colors.green,
                                    duration: Duration(seconds: 4),
                                  ),
                                );

                                // Navigate to login page
                                Navigator.of(
                                  context,
                                ).pushReplacementNamed('/login');
                              }
                            } catch (e) {
                              print('Password change error: $e');
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      e.toString().contains('Current password')
                                          ? 'Current password is incorrect'
                                          : e.toString().contains('recent')
                                          ? 'Please log out and log in again before changing password'
                                          : 'Error: ${e.toString().replaceAll('Exception: ', '')}',
                                    ),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                          child: const Text('Change'),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const Divider(height: 1),
              _profileItem(Icons.badge, 'Employee ID', 'TECH-${technician.id}'),
              const Divider(height: 1),
              // Team information - fetch from API
              FutureBuilder<List<Map<String, dynamic>>>(
                future: dataService.getTeamsForTechnician(
                  int.parse(technician.id),
                ),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return _profileItem(Icons.groups, 'Teams', 'Loading...');
                  } else if (snapshot.hasData && snapshot.data != null && snapshot.data!.isNotEmpty) {
                    final teams = snapshot.data!;
                    // Show first team with count if multiple
                    final firstTeam = teams.first;
                    final teamName = firstTeam['name'] ?? 'Unknown Team';
                    final role = firstTeam['role'] ?? 'Member';
                    final teamDisplay = teams.length > 1 
                        ? '$teamName (+${teams.length - 1} more)'
                        : teamName;

                    return Column(
                      children: [
                        _profileItem(Icons.groups, 'Teams', teamDisplay),
                        const Divider(height: 1),
                        _profileItem(
                          Icons.workspace_premium,
                          'Role in Team',
                          role,
                        ),
                      ],
                    );
                  } else {
                    return Column(
                      children: [
                        _profileItem(Icons.groups, 'Teams', 'No Team Yet'),
                        const Divider(height: 1),
                        _profileItem(
                          Icons.workspace_premium,
                          'Role in Team',
                          '-',
                        ),
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
                  // Filter tickets by any team membership
                  final myTeamTickets = tickets.where((t) {
                    if (_currentTeams.isEmpty) {
                      return false;
                    }
                    if (t.teamId == null) return false;
                    
                    // Check if ticket belongs to any of the technician's teams
                    final ticketTeamId = t.teamId.toString();
                    final memberTeamIds = _currentTeams
                        .where((team) => team['id'] != null)
                        .map((team) => team['id'].toString())
                        .toList();
                    return memberTeamIds.contains(ticketTeamId);
                  }).toList();

                  final completedCount = myTeamTickets
                      .where((t) => t.status.toUpperCase() == 'COMPLETED')
                      .length;

                  final pendingCount = myTeamTickets
                      .where(
                        (t) =>
                            t.status.toUpperCase() != 'COMPLETED' &&
                            t.status.toUpperCase() != 'NEW',
                      )
                      .length;

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
                      onPressed: () async {
                        await _authService.signOut();
                        ref.read(authProvider.notifier).logout();
                        if (context.mounted) {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(
                              builder: (_) => const LoginPage(),
                            ),
                            (route) => false,
                          );
                        }
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
    ),
    );
  }

  Widget _profileCard({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6),
        ],
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
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _profileItemEditable(
    IconData icon,
    String label,
    String value, {
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF2563EB), size: 20),
            const SizedBox(width: 12),
            Text(
              label,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const Spacer(),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.edit, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _ticketCard(BuildContext context, Ticket t, {bool showStatus = true}) {
    // Priority: normal or urgent
    final priority = t.priority.toLowerCase();
    final isUrgent = priority.contains('urgent');

    Color priorityColor = const Color(0xFF6B7280);
    IconData priorityIcon = Icons.trending_flat;

    if (isUrgent) {
      priorityColor = const Color(0xFFDC2626);
      priorityIcon = Icons.warning_amber_rounded;
    } else {
      priorityColor = const Color(0xFF6B7280);
      priorityIcon = Icons.trending_flat;
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
              color: isUrgent
                  ? priorityColor.withOpacity(0.12)
                  : Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
              spreadRadius: 0,
            ),
          ],
          border: Border.all(
            color: isUrgent
                ? priorityColor.withOpacity(0.4)
                : Colors.grey.withOpacity(0.15),
            width: isUrgent ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    priorityColor.withOpacity(0.05),
                    priorityColor.withOpacity(0.02),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E40AF).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.confirmation_number,
                            color: Color(0xFF1E40AF),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                t.id,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Fiber Maintenance',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Only show priority badge for urgent tickets
                  if (isUrgent)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            priorityColor,
                            priorityColor.withOpacity(0.8),
                          ],
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
                          Text(
                            t.priorityDisplay,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          t.customerNameDisplay.isNotEmpty
                              ? t.customerNameDisplay
                              : 'N/A',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.report_problem_outlined,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          t.complaint,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'SLA: ${t.sla}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF3B82F6),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Accept button using primary button component
                      PrimaryButton(
                        text: 'Accept',
                        variant: ButtonVariant.primary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        onPressed: () async {
                          final authState = ref.read(authProvider);
                          final currentTechnician = authState.technician;

                          if (currentTechnician == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Error: No technician logged in'),
                              ),
                            );
                            return;
                          }

                          // Accept ticket - update status, teamId, and startTime
                          try {
                            final techId = int.parse(currentTechnician.id);
                            print(
                              'Accepting ticket ${t.id} for technician $techId',
                            );

                            // Get the first team ID for this technician
                            int? teamId;
                            if (_currentTeams.isNotEmpty &&
                                _currentTeams.first['id'] != null) {
                              teamId = _currentTeams.first['id'] as int;
                              print('Assigning ticket to team: $teamId (${_currentTeams.first['name']})');
                              if (_currentTeams.length > 1) {
                                print('Note: Technician is in ${_currentTeams.length} teams, using first one');
                              }
                            } else {
                              print('WARNING: Technician has no team!');
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'You must be assigned to a team to accept tickets',
                                    ),
                                  ),
                                );
                              }
                              return;
                            }

                            final success = await dataService
                                .updateTicket(t.id, {
                                  'status': 'IN_PROGRESS',
                                  'teamId': teamId,
                                  'startTime': DateTime.now().toIso8601String(),
                                });
                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Ticket accepted! Check Tasks tab.',
                                  ),
                                ),
                              );
                              // Refresh tickets
                              ref.invalidate(ticketsProvider);
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to accept ticket'),
                                ),
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
            ),
          ],
        ),
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

    // Priority: normal or urgent (only show urgent badge)
    final priority = t.priority.toLowerCase();
    final isUrgent = priority.contains('urgent');

    Color priorityColor = const Color(0xFFDC2626);
    IconData priorityIcon = Icons.warning_amber_rounded;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                TicketDetailPage(ticketId: t.id, isFromTasksTab: true),
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
            ),
          ],
          border: Border.all(color: Colors.grey.withOpacity(0.15), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                                  colors: [
                                    statusColor.withOpacity(0.2),
                                    statusColor.withOpacity(0.1),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                statusIcon,
                                color: statusColor,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t.id,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: Color(0xFF1E293B),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: statusColor.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      t.statusDisplay,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: statusColor,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  // Only show priority badge for urgent tickets
                  if (isUrgent) const SizedBox(height: 12),
                  if (isUrgent)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            priorityColor,
                            priorityColor.withOpacity(0.8),
                          ],
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
                          Text(
                            t.priorityDisplay,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          t.customerNameDisplay.isNotEmpty
                              ? t.customerNameDisplay
                              : 'N/A',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.report_problem_outlined,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          t.complaint,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'SLA: ${t.sla}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF3B82F6),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusSection(
    String title,
    int count,
    Color color,
    IconData icon,
    bool isExpanded,
    VoidCallback onToggle,
  ) {
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
}

class _PhoneManagementDialog extends ConsumerStatefulWidget {
  final int technicianId;
  final List<String> initialPhones;
  final VoidCallback onUpdate;

  const _PhoneManagementDialog({
    required this.technicianId,
    required this.initialPhones,
    required this.onUpdate,
  });

  @override
  ConsumerState<_PhoneManagementDialog> createState() =>
      _PhoneManagementDialogState();
}

class _PhoneManagementDialogState
    extends ConsumerState<_PhoneManagementDialog> {
  late List<String> phones;
  final TextEditingController _newPhoneController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    phones = List<String>.from(widget.initialPhones);
  }

  @override
  void dispose() {
    _newPhoneController.dispose();
    super.dispose();
  }

  Future<void> _savePhones() async {
    setState(() {
      _isSaving = true;
    });

    try {
      final dataService = ref.read(dataServiceProvider);
      await dataService.updateTechnician(widget.technicianId, {
        'phone': phones,
      });
      widget.onUpdate();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Phone numbers updated')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  void _addPhone() {
    final phone = _newPhoneController.text.trim();
    if (phone.isNotEmpty) {
      setState(() {
        phones.add(phone);
        _newPhoneController.clear();
      });
    }
  }

  void _removePhone(int index) {
    setState(() {
      phones.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Manage Phone Numbers'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // List of existing phone numbers
            if (phones.isNotEmpty) ...[
              const Text(
                'Phone Numbers:',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const SizedBox(height: 8),
              ...phones.asMap().entries.map((entry) {
                final index = entry.key;
                final phone = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.phone, size: 16, color: Colors.blue),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          phone,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(
                          Icons.delete_outline,
                          color: Colors.red,
                        ),
                        onPressed: () => _removePhone(index),
                        iconSize: 20,
                        constraints: const BoxConstraints(),
                        padding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 16),
            ],
            // Add new phone number
            const Text(
              'Add Phone Number:',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _newPhoneController,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    keyboardType: TextInputType.phone,
                    onSubmitted: (_) => _addPhone(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.add_circle, color: Colors.green),
                  onPressed: _addPhone,
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSaving ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSaving ? null : _savePhones,
          child: _isSaving
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),
      ],
    );
  }
}
