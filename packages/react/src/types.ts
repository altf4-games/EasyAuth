/** Text labels for the AuthModal. All strings are overridable. */
export interface AuthLabels {
  emailPlaceholder: string;
  emailLabel: string;
  sendCodeButton: string;
  otpLabel: string;
  otpPlaceholder: string;
  verifyButton: string;
  twoFALabel: string;
  twoFAPlaceholder: string;
  verifyTwoFAButton: string;
  backButton: string;
  newUserMessage: string;
  successMessage: string;
}

export const DEFAULT_LABELS: AuthLabels = {
  emailPlaceholder: "you@example.com",
  emailLabel: "Email address",
  sendCodeButton: "Send code",
  otpLabel: "Enter the 6-digit code sent to your email",
  otpPlaceholder: "123456",
  verifyButton: "Verify code",
  twoFALabel: "Enter your authenticator code",
  twoFAPlaceholder: "000000",
  verifyTwoFAButton: "Verify",
  backButton: "Back",
  newUserMessage: "Welcome! Your account has been created.",
  successMessage: "Signed in successfully.",
};

/** Error code → human-readable message mapping */
export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Please enter a valid email address.",
  OTP_EXPIRED: "Your code has expired. Please request a new one.",
  OTP_INVALID: "Incorrect code. Please try again.",
  OTP_MAX_ATTEMPTS: "Too many attempts. Your account is temporarily locked.",
  ACCOUNT_LOCKED: "This account is temporarily locked. Please try again later.",
  TOKEN_INVALID: "Session is invalid. Please sign in again.",
  TOKEN_EXPIRED: "Session has expired. Please sign in again.",
  "2FA_NOT_ENROLLED": "Two-factor authentication is not set up.",
  "2FA_INVALID": "Invalid authenticator code. Try again or use a backup code.",
  "2FA_ALREADY_ENROLLED": "Two-factor authentication is already set up.",
  CONFIG_INVALID: "Server configuration error. Please contact support.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES["UNKNOWN"]!;
}
