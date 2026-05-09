import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'home_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _storage = const FlutterSecureStorage();
  String _userEmail = 'Loading profile...';
  String _protectedData = '';

  @override
  void initState() {
    super.initState();
    _fetchProtectedData();
  }

  Future<void> _fetchProtectedData() async {
    final token = await _storage.read(key: 'jwt_token');

    if (token == null) {
      if (mounted) _logOut();
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/user'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _userEmail = data['user']['email'] ?? 'Unknown User';
          _protectedData = "User token successfully validated by the server!";
        });
      } else {
        setState(() {
          _userEmail = "Unauthorized";
          _protectedData = "Error: Invalid token / Server rejected us";
        });
      }
    } catch (e) {
      setState(() {
        _userEmail = "Offline";
        _protectedData = "Failed to fetch from ${AppConfig.apiBaseUrl}: $e";
      });
    }
  }

  Future<void> _logOut() async {
    await _storage.delete(key: 'jwt_token');
    if (mounted) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logOut(),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Hello, $_userEmail',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 32),
              Card(
                color: Colors.green.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(_protectedData, textAlign: TextAlign.center),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
