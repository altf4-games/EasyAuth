import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'models.dart';

enum _Step { email, otp, twoFa }

class EasyAuthModal extends StatefulWidget {
  final Uri apiBaseUrl;
  final EasyAuthLabels labels;
  final Map<String, String>? errorMessages;
  final http.Client? client;

  const EasyAuthModal({
    super.key,
    required this.apiBaseUrl,
    this.labels = const EasyAuthLabels(),
    this.errorMessages,
    this.client,
  });

  /// Displays the authentication modal as a bottom sheet.
  /// Returns an [EasyAuthResult] if successful, or null if dismissed.
  static Future<EasyAuthResult?> show(
    BuildContext context, {
    required Uri apiBaseUrl,
    EasyAuthLabels labels = const EasyAuthLabels(),
    Map<String, String>? errorMessages,
    bool isScrollControlled = true,
    http.Client? client,
  }) {
    return showModalBottomSheet<EasyAuthResult>(
      context: context,
      isScrollControlled: isScrollControlled,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: EasyAuthModal(
          apiBaseUrl: apiBaseUrl,
          labels: labels,
          errorMessages: errorMessages,
          client: client,
        ),
      ),
    );
  }

  @override
  State<EasyAuthModal> createState() => _EasyAuthModalState();
}

class _EasyAuthModalState extends State<EasyAuthModal> {
  _Step _step = _Step.email;
  bool _isLoading = false;
  String? _error;

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final FocusNode _otpFocus = FocusNode();

  String? _pendingToken;
  EasyAuthUser? _pendingUser;
  bool? _pendingIsNewUser;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _otpFocus.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, String> body) async {
    final client = widget.client ?? http.Client();
    try {
      final response = await client.post(
        widget.apiBaseUrl.resolve(path),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      if (response.statusCode >= 400) {
        final code = data['error'] as String? ?? 'UNKNOWN';
        throw Exception(code);
      }

      return data;
    } finally {
      if (widget.client == null) {
        client.close();
      }
    }
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _post('send-otp', {'email': email});
      setState(() {
        _step = _Step.otp;
        _otpController.clear();
      });
      _otpFocus.requestFocus();
    } catch (e) {
      setState(() {
        _error = getErrorMessage(
          e.toString().replaceAll('Exception: ', ''),
          widget.errorMessages,
        );
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    final email = _emailController.text.trim();
    final code = _otpController.text.trim();
    if (code.length < 6) return; // Basic validation

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _post('verify-otp', {'email': email, 'code': code});
      final token = data['token'] as String;
      final user = EasyAuthUser.fromJson(data['user'] as Map<String, dynamic>);
      final isNewUser = data['isNewUser'] as bool;

      if (data['requires2FA'] == true || user.totpEnabled) {
        setState(() {
          _pendingToken = token;
          _pendingUser = user;
          _pendingIsNewUser = isNewUser;
          _step = _Step.twoFa;
          _otpController.clear();
        });
        _otpFocus.requestFocus();
      } else {
        if (mounted) {
          Navigator.of(context).pop(
            EasyAuthResult(token: token, user: user, isNewUser: isNewUser),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = getErrorMessage(
          e.toString().replaceAll('Exception: ', ''),
          widget.errorMessages,
        );
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _verify2Fa() async {
    final email = _emailController.text.trim();
    final code = _otpController.text.trim();
    if (code.length < 6) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _post('verify-2fa', {'email': email, 'code': code});
      final token = data['token'] as String? ?? _pendingToken!;
      final user = data['user'] != null 
          ? EasyAuthUser.fromJson(data['user'] as Map<String, dynamic>) 
          : _pendingUser!;

      if (mounted) {
        Navigator.of(context).pop(
          EasyAuthResult(
            token: token,
            user: user,
            isNewUser: _pendingIsNewUser!,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = getErrorMessage(
          e.toString().replaceAll('Exception: ', ''),
          widget.errorMessages,
        );
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _step == _Step.email
                      ? 'Sign in'
                      : _step == _Step.otp
                          ? 'Check your email'
                          : 'Two-factor authentication',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  softWrap: true,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _step == _Step.email
                ? 'We\'ll send a one-time code to your email.'
                : _step == _Step.otp
                    ? widget.labels.otpLabel
                    : widget.labels.twoFALabel,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 24),
          if (_step == _Step.email) ...[
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: widget.labels.emailLabel,
                hintText: widget.labels.emailPlaceholder,
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendOtp(),
              enabled: !_isLoading,
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            FilledButton(
              onPressed: _isLoading ? null : _sendOtp,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(widget.labels.sendCodeButton),
            ),
          ] else ...[
            TextField(
              controller: _otpController,
              focusNode: _otpFocus,
              decoration: InputDecoration(
                hintText: _step == _Step.otp
                    ? widget.labels.otpPlaceholder
                    : widget.labels.twoFAPlaceholder,
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, letterSpacing: 8),
              onSubmitted: (_) => _step == _Step.otp ? _verifyOtp() : _verify2Fa(),
              enabled: !_isLoading,
            ),
            const SizedBox(height: 16),
             if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                  textAlign: TextAlign.center,
                ),
              ),
            FilledButton(
              onPressed: _isLoading
                  ? null
                  : _step == _Step.otp
                      ? _verifyOtp
                      : _verify2Fa,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(
                      _step == _Step.otp
                          ? widget.labels.verifyButton
                          : widget.labels.verifyTwoFAButton,
                    ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _isLoading
                  ? null
                  : () {
                      setState(() {
                        _step = _Step.email;
                        _error = null;
                        _otpController.clear();
                      });
                    },
              child: Text(widget.labels.backButton),
            ),
          ],
        ],
      ),
    );
  }
}
