import * as react_jsx_runtime from 'react/jsx-runtime';

/** Text labels for the AuthModal. All strings are overridable. */
interface AuthLabels {
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
declare const DEFAULT_LABELS: AuthLabels;
declare function getErrorMessage(code: string): string;

type Theme = "light" | "dark" | "auto";
interface UserPayload {
    email: string;
    createdAt: number;
    lastLoginAt: number;
    totpEnabled: boolean;
    metadata: Record<string, unknown>;
}
interface AuthModalProps {
    /** Base URL of your auth endpoints, e.g. "/api/auth" */
    apiBaseUrl: string;
    /** Called with the session token and user when authentication succeeds */
    onSuccess: (token: string, user: UserPayload, isNewUser: boolean) => void;
    /** Called when the user dismisses the modal */
    onClose: () => void;
    /** Extra class appended to the modal root element */
    className?: string;
    /** Override any individual text string */
    labels?: Partial<AuthLabels>;
    /** Color scheme — defaults to "auto" (follows system preference) */
    theme?: Theme;
}
/**
 * AuthModal — handles the full email OTP + optional TOTP 2FA flow.
 * Calls your backend API endpoints and reports success via onSuccess.
 */
declare function AuthModal({ apiBaseUrl, onSuccess, onClose, className, labels: labelOverrides, theme, }: AuthModalProps): react_jsx_runtime.JSX.Element;

export { type AuthLabels, AuthModal, type AuthModalProps, DEFAULT_LABELS, type UserPayload, getErrorMessage };
