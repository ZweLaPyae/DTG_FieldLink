// lib/pages/notifications_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../data_service.dart';
import '../services/notification_service.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

/// Helper function to convert DateTime to Myanmar timezone (UTC+6:30)
DateTime toMyanmarTime(DateTime utcTime) {
  // Myanmar timezone is UTC+6:30
  return utcTime.toUtc().add(const Duration(hours: 6, minutes: 30));
}

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  final DataService _dataService = DataService();
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = true;
  String? _error;
  
  // Store callback reference so we can remove it in dispose
  late final Function() _notificationCallback;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    
    // Create callback reference
    _notificationCallback = () {
      print('🔄 Notification received, refreshing list...');
      _loadNotifications();
    };
    
    // Register callback to auto-refresh when notification arrives
    addNotificationListener(_notificationCallback);
  }

  @override
  void dispose() {
    removeNotificationListener(_notificationCallback);
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authState = ref.read(authProvider);
      final technicianId = authState.technician?.id;

      if (technicianId == null) {
        throw Exception('User not logged in');
      }

      final technicianIdInt = int.parse(technicianId);

      final data = await _dataService.loadNotifications(technicianIdInt);
      setState(() {
        _notifications = List<Map<String, dynamic>>.from(data['notifications']);
        _unreadCount = data['unreadCount'] ?? 0;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      print('Error loading notifications: $e');
    }
  }

  Future<void> _markAsRead(int notificationId) async {
    try {
      await _dataService.markNotificationsAsRead(notificationIds: [notificationId]);
      
      setState(() {
        final notification = _notifications.firstWhere((n) => n['id'] == notificationId);
        notification['read'] = true;
        if (_unreadCount > 0) _unreadCount--;
      });
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final authState = ref.read(authProvider);
      final technicianId = authState.technician?.id;

      if (technicianId == null) return;

      final technicianIdInt = int.parse(technicianId);

      await _dataService.markNotificationsAsRead(
        userId: technicianIdInt,
        userType: 'technician',
        markAll: true,
      );

      setState(() {
        for (var notification in _notifications) {
          notification['read'] = true;
        }
        _unreadCount = 0;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read')),
      );
    } catch (e) {
      print('Error marking all as read: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _handleNotificationTap(Map<String, dynamic> notification) {
    // Mark as read
    if (!notification['read']) {
      _markAsRead(notification['id']);
    }

    // Navigate to ticket if ticketId exists
    final ticketId = notification['ticketId'];
    if (ticketId != null) {
      context.go('/ticket-detail/$ticketId');
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'ticket_created':
      case 'ticket_assigned':
        return Icons.assignment_outlined;
      case 'ticket_in_progress':
        return Icons.pending_actions_outlined;
      case 'ticket_review_requested':
        return Icons.rate_review_outlined;
      case 'ticket_completed':
        return Icons.check_circle_outline;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'ticket_created':
      case 'ticket_assigned':
        return Colors.blue;
      case 'ticket_in_progress':
        return Colors.orange;
      case 'ticket_review_requested':
        return Colors.purple;
      case 'ticket_completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications'),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_unreadCount',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: const Color(0xFF1976D2),
        foregroundColor: Colors.white,
        actions: [
          if (_notifications.isNotEmpty && _unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all),
              tooltip: 'Mark all as read',
              onPressed: _markAllAsRead,
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _loadNotifications,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text('Error loading notifications', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadNotifications,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No notifications yet', style: TextStyle(fontSize: 16, color: Colors.grey[600])),
            const SizedBox(height: 8),
            Text('You\'ll see your notifications here', style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      child: ListView.builder(
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          final isUnread = !notification['read'];
          final type = notification['type'] ?? 'general';
          final createdAt = DateTime.parse(notification['createdAt']);
          final timeAgo = _formatTimeAgo(createdAt);

          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            color: isUnread ? Colors.blue.shade50 : Colors.white,
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: _getColorForType(type).withOpacity(0.2),
                child: Icon(_getIconForType(type), color: _getColorForType(type)),
              ),
              title: Row(
                children: [
                  Expanded(
                    child: Text(
                      notification['title'] ?? 'Notification',
                      style: TextStyle(
                        fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                  if (isUnread)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(notification['body'] ?? ''),
                  const SizedBox(height: 4),
                  Text(
                    timeAgo,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
              onTap: () => _handleNotificationTap(notification),
            ),
          );
        },
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    // Convert both times to Myanmar timezone for accurate comparison
    final myanmarDateTime = toMyanmarTime(dateTime);
    final nowInMyanmar = toMyanmarTime(DateTime.now().toUtc());
    final difference = nowInMyanmar.difference(myanmarDateTime);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      // Show absolute date in Myanmar timezone
      return DateFormat('MMM d, yyyy').format(myanmarDateTime);
    }
  }
}
