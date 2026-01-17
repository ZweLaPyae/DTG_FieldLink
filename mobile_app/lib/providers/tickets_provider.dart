// lib/providers/tickets_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models.dart';
import '../data_service.dart';

/// Provider for DataService
final dataServiceProvider = Provider<DataService>((ref) => DataService());

/// Tickets state notifier
class TicketsNotifier extends StateNotifier<AsyncValue<List<Ticket>>> {
  TicketsNotifier(this.ref) : super(const AsyncValue.loading()) {
    loadTickets();
  }
  
  final Ref ref;
  
  Future<void> loadTickets({bool forceRefresh = false}) async {
    final dataService = ref.read(dataServiceProvider);
    
    try {
      state = const AsyncValue.loading();
      final tickets = await dataService.loadTickets();
      state = AsyncValue.data(tickets);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
  
  Future<void> updateTicketStatus(String ticketId, Map<String, dynamic> updates) async {
    final dataService = ref.read(dataServiceProvider);
    
    try {
      await dataService.updateTicket(ticketId, updates);
      await loadTickets(forceRefresh: true);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}

/// Provider for tickets list
final ticketsProvider = StateNotifierProvider<TicketsNotifier, AsyncValue<List<Ticket>>>((ref) {
  return TicketsNotifier(ref);
});

/// Filtered tickets providers
final availableTicketsProvider = Provider<List<Ticket>>((ref) {
  final ticketsAsync = ref.watch(ticketsProvider);
  return ticketsAsync.when(
    data: (tickets) => tickets.where((t) => 
      !t.status.toLowerCase().contains('in-progress') && 
      !t.status.toLowerCase().contains('completed')
    ).toList(),
    loading: () => [],
    error: (_, __) => [],
  );
});

final assignedTicketsProvider = Provider<List<Ticket>>((ref) {
  final ticketsAsync = ref.watch(ticketsProvider);
  return ticketsAsync.when(
    data: (tickets) => tickets.where((t) => 
      t.status.toLowerCase().contains('in-progress') || 
      t.status.toLowerCase().contains('completed')
    ).toList(),
    loading: () => [],
    error: (_, __) => [],
  );
});

/// Individual ticket provider
final ticketProvider = FutureProvider.family<Ticket?, String>((ref, ticketId) async {
  final dataService = ref.read(dataServiceProvider);
  return await dataService.loadTicketById(ticketId);
});
