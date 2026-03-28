import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:easy_auth_flutter/easy_auth_flutter.dart';

void main() {
  final apiBaseUrl = Uri.parse('https://api.example.com/auth/');
  
  final mockUserJson = {
    'email': 'user@example.com',
    'createdAt': 123456789,
    'lastLoginAt': 123456789,
    'totpEnabled': false,
    'metadata': {},
  };

  Widget buildTestApp(http.Client client) {
    return MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: ElevatedButton(
              onPressed: () {
                EasyAuthModal.show(
                  context,
                  apiBaseUrl: apiBaseUrl,
                  client: client,
                );
              },
              child: const Text('Open Modal'),
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('renders email step initially', (WidgetTester tester) async {
    final client = MockClient((request) async => http.Response('', 404));
    await tester.pumpWidget(buildTestApp(client));

    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Email address'), findsOneWidget);
    expect(find.text('Send code'), findsOneWidget);
  });

  testWidgets('submits email and transitions to OTP step', (WidgetTester tester) async {
    final client = MockClient((request) async {
      if (request.url.path.endsWith('/send-otp')) {
        return http.Response(jsonEncode({'ok': true}), 200);
      }
      return http.Response('{}', 404);
    });
    
    await tester.pumpWidget(buildTestApp(client));
    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'user@example.com');
    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle(); // Wait for network and anim

    expect(find.text('Check your email'), findsOneWidget);
  });

  testWidgets('displays error message on failed sendOTP', (WidgetTester tester) async {
    final client = MockClient((request) async {
      if (request.url.path.endsWith('/send-otp')) {
        return http.Response(jsonEncode({'error': 'INVALID_EMAIL'}), 400);
      }
      return http.Response('{}', 404);
    });
    
    await tester.pumpWidget(buildTestApp(client));
    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'invalid');
    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle();

    // The modal should remain on email step and show error
    expect(find.text('Please enter a valid email address.'), findsOneWidget);
  });

  testWidgets('submits OTP and pops the modal with result', (WidgetTester tester) async {
    final client = MockClient((request) async {
      if (request.url.path.endsWith('/send-otp')) {
        return http.Response(jsonEncode({'ok': true}), 200);
      }
      if (request.url.path.endsWith('/verify-otp')) {
        return http.Response(jsonEncode({
          'token': 'jwt-token',
          'user': mockUserJson,
          'isNewUser': false,
        }), 200);
      }
      return http.Response('{}', 404);
    });

    EasyAuthResult? result;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ElevatedButton(
              onPressed: () async {
                result = await EasyAuthModal.show(
                  context,
                  apiBaseUrl: apiBaseUrl,
                  client: client,
                );
              },
              child: const Text('Open Modal'),
            ),
          ),
        ),
      ),
    );

    // Open Modal
    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    // Submit Email
    await tester.enterText(find.byType(TextField), 'user@example.com');
    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle();

    // Verify OTP step 
    expect(find.text('Check your email'), findsOneWidget);
    // Submit OTP
    await tester.enterText(find.byType(TextField), '123456');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle(); 

    // Verify modal is closed
    expect(find.text('Check your email'), findsNothing);
    expect(result, isNotNull);
    expect(result!.token, 'jwt-token');
    expect(result!.user.email, 'user@example.com');
  });

  testWidgets('submits OTP and transitions to 2FA if required', (WidgetTester tester) async {
    final client = MockClient((request) async {
      if (request.url.path.endsWith('/send-otp')) {
        return http.Response(jsonEncode({'ok': true}), 200);
      }
      if (request.url.path.endsWith('/verify-otp')) {
        return http.Response(jsonEncode({
          'token': 'jwt-token-pending',
          'user': {...mockUserJson, 'totpEnabled': true},
          'isNewUser': false,
          'requires2FA': true,
        }), 200);
      }
      if (request.url.path.endsWith('/verify-2fa')) {
        return http.Response(jsonEncode({
          'token': 'jwt-token-final',
          'user': {...mockUserJson, 'totpEnabled': true},
        }), 200);
      }
      return http.Response('{}', 404);
    });

    await tester.pumpWidget(buildTestApp(client));

    // Open Modal
    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    // Submit Email
    await tester.enterText(find.byType(TextField), 'user@example.com');
    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle();

    // Submit OTP
    await tester.enterText(find.byType(TextField), '123456');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle(); 

    // Should be on 2FA step 
    expect(find.text('Two-factor authentication'), findsOneWidget);
    expect(find.text('Enter your authenticator code'), findsOneWidget);

    // Submit 2FA
    await tester.enterText(find.byType(TextField), '654321');
    await tester.tap(find.text('Verify'));
    await tester.pumpAndSettle();

    // Modal closed
    expect(find.byType(EasyAuthModal), findsNothing);
  });
}
