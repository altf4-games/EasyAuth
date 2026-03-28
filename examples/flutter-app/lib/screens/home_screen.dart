import 'package:flutter/material.dart';
import 'package:easy_auth_flutter/easy_auth_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dashboard_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  final _storage = const FlutterSecureStorage();

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
                final uri = Uri.parse('http://10.0.2.2:3000/api/auth/'); 

                final result = await EasyAuthModal.show(
                  context,
                  apiBaseUrl: uri,
                );

                if (result != null && context.mounted) {
                  // Successful login! Save the token securely.
                  await _storage.write(key: 'jwt_token', value: result.token);
                  
                  // Navigate to protected page
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => DashboardScreen(userEmail: result.user.email),
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
