import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'home_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String userEmail;
  const DashboardScreen({super.key, required this.userEmail});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _storage = const FlutterSecureStorage();
  String _protectedData = 'Loading...';

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
        Uri.parse('http://10.0.2.2:3000/api/user'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _protectedData = "User validated from server!\nEmail matches: ${data['user']['email']}";
        });
      } else {
        setState(() {
          _protectedData = "Error: Invalid token / Server rejected us";
        });
      }
    } catch (e) {
      setState(() {
        _protectedData = "Failed to fetch: $e";
      });
    }
  }

  Future<void> _logOut() async {
    await _storage.delete(key: 'jwt_token');
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
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
          )
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Hello, ${widget.userEmail}', style: Theme.of(context).textTheme.headlineSmall),
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
