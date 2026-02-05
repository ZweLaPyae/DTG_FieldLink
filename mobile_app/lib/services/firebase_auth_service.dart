// lib/services/firebase_auth_service.dart
import 'package:firebase_auth/firebase_auth.dart';
import '../models.dart';
import '../data_service.dart';

/// Firebase Authentication Service
/// Handles user authentication using Firebase Auth
class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DataService _dataService = DataService();

  /// Sign in with email and password
  /// Returns Technician model if successful, null otherwise
  Future<Technician?> signInWithEmailPassword(String email, String password) async {
    try {
      // Step 1: Authenticate with Firebase
      final UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password.trim(),
      );

      if (userCredential.user == null) {
        print('Firebase sign-in failed: No user returned');
        return null;
      }

      print('Firebase sign-in successful: ${userCredential.user!.email}');

      // Step 2: Fetch technician data from backend using email
      final technician = await _fetchTechnicianByEmail(email.trim());
      
      if (technician == null) {
        print('Error: Technician not found in database for email: $email');
        // Sign out from Firebase since we can't find user in our database
        await signOut();
        return null;
      }

      print('Technician loaded: ${technician.name} (ID: ${technician.id})');
      return technician;
      
    } on FirebaseAuthException catch (e) {
      // Handle Firebase-specific errors
      print('Firebase Auth Error: ${e.code} - ${e.message}');
      
      switch (e.code) {
        case 'user-not-found':
          throw 'No user found with this email. Please contact admin.';
        case 'wrong-password':
          throw 'Incorrect password. Please try again.';
        case 'invalid-email':
          throw 'Invalid email format.';
        case 'user-disabled':
          throw 'This account has been disabled. Please contact admin.';
        case 'too-many-requests':
          throw 'Too many failed attempts. Please try again later.';
        case 'operation-not-allowed':
          throw 'Email/password sign-in is not enabled. Please contact admin.'; // TODO: Enable in Firebase Console
        default:
          throw 'Authentication failed: ${e.message}';
      }
    } catch (e) {
      print('Unexpected error during sign-in: $e');
      throw 'An unexpected error occurred. Please try again.';
    }
  }

  /// Fetch technician from backend by email
  Future<Technician?> _fetchTechnicianByEmail(String email) async {
    try {
      // TODO: Add backend endpoint: GET /technicians/by-email/:email
      // For now, fetch all and filter (not efficient for large datasets)
      final technicians = await _dataService.loadTechnicians();
      
      // Find technician with matching email (case-insensitive)
      final technician = technicians.firstWhere(
        (tech) => tech.email.toLowerCase() == email.toLowerCase(),
        orElse: () => throw Exception('Technician not found'),
      );
      
      return technician;
    } catch (e) {
      print('Error fetching technician by email: $e');
      return null;
    }
  }

  /// Sign out current user
  Future<void> signOut() async {
    try {
      await _auth.signOut();
      print('User signed out successfully');
    } catch (e) {
      print('Error signing out: $e');
      rethrow;
    }
  }

  /// Get current Firebase user
  User? getCurrentUser() {
    return _auth.currentUser;
  }

  /// Check if user is signed in
  bool isSignedIn() {
    return _auth.currentUser != null;
  }

  /// Get user email
  String? getUserEmail() {
    return _auth.currentUser?.email;
  }

  /// Listen to auth state changes
  Stream<User?> authStateChanges() {
    return _auth.authStateChanges();
  }

  /// Send password reset email
  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
      print('Password reset email sent to: $email');
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'user-not-found':
          throw 'No user found with this email.';
        case 'invalid-email':
          throw 'Invalid email format.';
        default:
          throw 'Failed to send reset email: ${e.message}';
      }
    }
  }

  /// Update user password (requires recent sign-in)
  Future<void> updatePassword(String newPassword) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        throw 'No user signed in';
      }
      
      await user.updatePassword(newPassword);
      print('Password updated successfully');
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'requires-recent-login':
          throw 'Please sign in again before changing your password.';
        case 'weak-password':
          throw 'Password is too weak. Use at least 6 characters.';
        default:
          throw 'Failed to update password: ${e.message}';
      }
    }
  }
}
