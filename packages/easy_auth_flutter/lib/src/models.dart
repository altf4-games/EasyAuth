class EasyAuthUser {
  final String email;
  final int createdAt;
  final int lastLoginAt;
  final bool totpEnabled;
  final Map<String, dynamic> metadata;

  EasyAuthUser({
    required this.email,
    required this.createdAt,
    required this.lastLoginAt,
    required this.totpEnabled,
    required this.metadata,
  });

  factory EasyAuthUser.fromJson(Map<String, dynamic> json) {
    return EasyAuthUser(
      email: json['email'] as String,
      createdAt: json['createdAt'] as int,
      lastLoginAt: json['lastLoginAt'] as int,
      totpEnabled: json['totpEnabled'] as bool? ?? false,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
    );
  }
}

class EasyAuthResult {
  final String token;
  final EasyAuthUser user;
  final bool isNewUser;

  EasyAuthResult({
    required this.token,
    required this.user,
    required this.isNewUser,
  });
}

class EasyAuthLabels {
  final String emailPlaceholder;
  final String emailLabel;
  final String sendCodeButton;
  final String otpLabel;
  final String otpPlaceholder;
  final String verifyButton;
  final String twoFALabel;
  final String twoFAPlaceholder;
  final String verifyTwoFAButton;
  final String backButton;

  const EasyAuthLabels({
    this.emailPlaceholder = 'you@example.com',
    this.emailLabel = 'Email address',
    this.sendCodeButton = 'Send code',
    this.otpLabel = 'Enter the 6-digit code sent to your email',
    this.otpPlaceholder = '123456',
    this.verifyButton = 'Verify code',
    this.twoFALabel = 'Enter your authenticator code',
    this.twoFAPlaceholder = '000000',
    this.verifyTwoFAButton = 'Verify',
    this.backButton = 'Back',
  });
}

const defaultErrorMessages = <String, String>{
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'OTP_EXPIRED': 'Your code has expired. Please request a new one.',
  'OTP_INVALID': 'Incorrect code. Please try again.',
  'OTP_MAX_ATTEMPTS': 'Too many attempts. Your account is temporarily locked.',
  'ACCOUNT_LOCKED': 'This account is temporarily locked. Please try again later.',
  'TOKEN_INVALID': 'Session is invalid. Please sign in again.',
  'TOKEN_EXPIRED': 'Session has expired. Please sign in again.',
  '2FA_NOT_ENROLLED': 'Two-factor authentication is not set up.',
  '2FA_INVALID': 'Invalid authenticator code. Try again or use a backup code.',
  'CONFIG_INVALID': 'Server configuration error. Please contact support.',
  'UNKNOWN': 'Something went wrong. Please try again.',
};

String getErrorMessage(String code, [Map<String, String>? overrides]) {
  return overrides?[code] ?? defaultErrorMessages[code] ?? defaultErrorMessages['UNKNOWN']!;
}
