// lib/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models.dart';
import '../data_service.dart';

// Auth state class
class AuthState {
  final Technician? technician;
  final bool isAuthenticated;

  AuthState({
    this.technician,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    Technician? technician,
    bool? isAuthenticated,
  }) {
    return AuthState(
      technician: technician ?? this.technician,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final DataService _dataService = DataService();

  AuthNotifier() : super(AuthState());

  void login(Technician technician) {
    state = AuthState(
      technician: technician,
      isAuthenticated: true,
    );
  }

  void logout() {
    state = AuthState(
      technician: null,
      isAuthenticated: false,
    );
  }

  void updateTechnician(Technician technician) {
    state = state.copyWith(technician: technician);
  }

  // Refresh technician data from backend
  Future<void> refreshTechnician() async {
    if (state.technician == null) return;
    
    try {
      final technicianId = int.parse(state.technician!.id);
      final updatedTechnician = await _dataService.getTechnicianById(technicianId);
      
      if (updatedTechnician != null) {
        updateTechnician(updatedTechnician);
      }
    } catch (e) {
      print('Error refreshing technician: $e');
    }
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
