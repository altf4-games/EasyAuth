import 'package:flutter/material.dart';
import 'package:easy_auth_flutter/easy_auth_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:app_links/app_links.dart';
import '../config.dart';
import 'dashboard_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _storage = const FlutterSecureStorage();
  late AppLinks _appLinks;

  @override
  void initState() {
    super.initState();
    _checkExistingToken();
    _initDeepLinks();
  }

  Future<void> _checkExistingToken() async {
    final token = await _storage.read(key: 'jwt_token');
    if (token != null && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => const DashboardScreen(),
        ),
      );
    }
  }

  void _initDeepLinks() async {
    _appLinks = AppLinks();
    
    final initialLink = await _appLinks.getInitialLink();
    if (initialLink != null) {
      _processToken(initialLink);
    }

    _appLinks.uriLinkStream.listen((Uri? uri) {
      if (uri != null) {
        _processToken(uri);
      }
    }, onError: (err) {
      debugPrint('Deep link error: \');
    });
  }

  void _processToken(Uri uri) async {
    final token = uri.queryParameters['token'];
    if (token != null && mounted) {
      await _storage.write(key: 'jwt_token', value: token);
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => const DashboardScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('EasyAuth Demo')),
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
                final baseStr = '${AppConfig.apiBaseUrl}/auth'; 

                final result = await EasyAuthModal.show(
                  context,
                  apiBaseUrl: Uri.parse(baseStr),
                  // Customizable deep link scheme:
                  deepLinkScheme: 'easyauth://callback',
                );

                if (result != null && context.mounted) {
                  await _storage.write(key: 'jwt_token', value: result.token);

                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => const DashboardScreen(),
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
