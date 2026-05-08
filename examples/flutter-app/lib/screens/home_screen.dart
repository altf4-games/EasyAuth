import 'package:flutter/material.dart';
import 'package:easy_auth_flutter/easy_auth_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:app_links/app_links.dart';
import 'dashboard_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _storage = const FlutterSecureStorage();
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();
    _handleIncomingLinks();
  }

  void _handleIncomingLinks() {
    _appLinks.uriLinkStream.listen((uri) async {
      final token = uri.queryParameters['token'];
      if (token != null && mounted) {
        // Assume user email is retrieved via a /me endpoint later, or passed in state
        await _storage.write(key: 'jwt_token', value: token);
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => DashboardScreen(userEmail: 'Google User'),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EasyAuth Demo'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Welcome to EasyAuth App',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () async {
                // Determine API base URL dynamically or hardcode for dev:
                // Note: on Android emulator, 10.0.2.2 usually maps to localhost.
                final baseStr = 'http://10.0.2.2:3000/api/auth/';
                // We use fluent-auth:// scheme that we will define for the deep link return
                final uri = Uri.parse('$baseStr?returnTo=easyauth://callback');

                final result = await EasyAuthModal.show(
                  context,
                  apiBaseUrl: Uri.parse(baseStr),
                );

                if (result != null && context.mounted) {
                  // Successful login! Save the token securely.
                  await _storage.write(key: 'jwt_token', value: result.token);

                  // Navigate to protected page
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) =>
                          DashboardScreen(userEmail: result.user.email),
                    ),
                  );
                } else {
                  debugPrint('Modal dismissed without auth');
                }
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Text('Sign In', style: TextStyle(fontSize: 18)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
