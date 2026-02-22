// lib/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
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
  static const String _authKey = 'auth_technician_data';
  static const String _isAuthKey = 'is_authenticated';

  AuthNotifier() : super(AuthState()) {
    _loadPersistedAuth();
  }

  // Load persisted authentication from SharedPreferences
  Future<void> _loadPersistedAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isAuth = prefs.getBool(_isAuthKey) ?? false;
      
      if (isAuth) {
        final technicianJson = prefs.getString(_authKey);
        if (technicianJson != null) {
          final technicianMap = json.decode(technicianJson);
          final technician = Technician.fromJson(technicianMap);
          
          state = AuthState(
            technician: technician,
            isAuthenticated: true,
          );
          
          print('✅ Restored session for technician: ${technician.name}');
          
          // Optionally refresh technician data from backend
          refreshTechnician();
        }
      }
    } catch (e) {
      print('❌ Error loading persisted auth: $e');
    }
  }

  // Save authentication to SharedPreferences
  Future<void> _saveAuth(Technician technician) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final technicianJson = json.encode(technician.toJson());
      await prefs.setString(_authKey, technicianJson);
      await prefs.setBool(_isAuthKey, true);
      print('💾 Session saved for technician: ${technician.name}');
    } catch (e) {
      print('❌ Error saving auth: $e');
    }
  }

  // Clear authentication from SharedPreferences
  Future<void> _clearAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_authKey);
      await prefs.setBool(_isAuthKey, false);
      print('🗑️  Session cleared');
    } catch (e) {
      print('❌ Error clearing auth: $e');
    }
  }

  Future<void> login(Technician technician) async {
    state = AuthState(
      technician: technician,
      isAuthenticated: true,
    );
    await _saveAuth(technician);
  }

  Future<void> logout() async {
    await _clearAuth();
    state = AuthState(
      technician: null,
      isAuthenticated: false,
    );
  }

  Future<void> updateTechnician(Technician technician) async {
    state = state.copyWith(technician: technician);
    await _saveAuth(technician);
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
