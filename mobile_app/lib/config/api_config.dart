// lib/config/api_config.dart

class ApiConfig {
  // Backend server configuration (from backend/.env)
  // PORT: 4000 (backend is running on HTTP, not HTTPS)
  
  // Environment-specific base URLs:
  // - Android emulator: 10.0.2.2 maps to host machine's localhost
  // - iOS simulator: localhost works directly
  // - Physical device: use your computer's local IP address
  
  static const String _port = '3000';
  
  // Change this based on where you're running the app:
  static const String _environment = 'android-emulator'; // 'android-emulator', 'ios-simulator', or 'physical-device'
  
  // If using physical device, set your computer's IP here:
  static const String _physicalDeviceIp = '192.168.1.100'; // TODO: Update with your IP
  
  static String get baseUrl {
    switch (_environment) {
      case 'android-emulator':
        return 'http://10.0.2.2:$_port';
      case 'ios-simulator':
        return 'http://localhost:$_port';
      case 'physical-device':
        return 'http://$_physicalDeviceIp:$_port';
      default:
        return 'http://10.0.2.2:$_port';
    }
  }
  
  // API endpoints
  static const String ticketsEndpoint = '/tickets';
  static const String customersEndpoint = '/customers';
  static const String techniciansEndpoint = '/technicians';
  static const String serviceTypesEndpoint = '/service-type';
  static const String authEndpoint = '/auth';
  
  // Full URLs
  static String get ticketsUrl => '$baseUrl$ticketsEndpoint';
  static String get customersUrl => '$baseUrl$customersEndpoint';
  static String get techniciansUrl => '$baseUrl$techniciansEndpoint';
  static String get serviceTypesUrl => '$baseUrl$serviceTypesEndpoint';
  static String get authUrl => '$baseUrl$authEndpoint';
}
