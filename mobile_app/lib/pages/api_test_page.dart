// lib/pages/api_test_page.dart
import 'package:flutter/material.dart';
import '../data_service.dart';
import '../config/api_config.dart';

class ApiTestPage extends StatefulWidget {
  const ApiTestPage({super.key});

  @override
  State<ApiTestPage> createState() => _ApiTestPageState();
}

class _ApiTestPageState extends State<ApiTestPage> {
  final DataService _dataService = DataService();
  String _status = 'Not tested yet';
  bool _isLoading = false;

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _status = 'Testing connection to ${ApiConfig.baseUrl}...';
    });

    try {
      final tickets = await _dataService.loadTickets();
      setState(() {
        _isLoading = false;
        _status = '✅ Success! Loaded ${tickets.length} tickets from the database.\n\n'
            'API URL: ${ApiConfig.ticketsUrl}\n'
            'Tickets: ${tickets.map((t) => t.id).join(', ')}';
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _status = '❌ Error: $e\n\n'
            'API URL: ${ApiConfig.ticketsUrl}\n\n'
            'Common issues:\n'
            '1. Backend server not running (check port 4000)\n'
            '2. Wrong API URL in config (check api_config.dart)\n'
            '3. Network permission not granted\n'
            '4. CORS issue (backend needs cors enabled)';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('API Connection Test'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Backend Configuration',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Base URL: ${ApiConfig.baseUrl}'),
                    Text('Tickets Endpoint: ${ApiConfig.ticketsEndpoint}'),
                    const SizedBox(height: 16),
                    const Text(
                      'Note: Update baseUrl in lib/config/api_config.dart based on your device:',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '• Android Emulator: http://10.0.2.2:4000',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Text(
                      '• iOS Simulator: http://localhost:4000',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Text(
                      '• Physical Device: http://YOUR_IP:4000',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _testConnection,
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.wifi_tethering),
              label: Text(_isLoading ? 'Testing...' : 'Test Connection'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Card(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(_status),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
