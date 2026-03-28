import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";
import { DEFAULT_LABELS, getErrorMessage, type AuthLabels } from "./types.js";

type Step = "email" | "otp" | "twofa";
type Theme = "light" | "dark" | "auto";

export interface UserPayload {
  email: string;
  createdAt: number;
  lastLoginAt: number;
  totpEnabled: boolean;
  metadata: Record<string, unknown>;
}

export interface AuthModalProps {
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

/** Number of individual digit inputs in the OTP / 2FA field */
const CODE_LENGTH = 6;

/** Builds a Tailwind class string for the code digit input boxes */
const digitInputClass =
  "w-10 h-12 text-center text-lg font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 caret-transparent";

/**
 * AuthModal — handles the full email OTP + optional TOTP 2FA flow.
 * Calls your backend API endpoints and reports success via onSuccess.
 */
export function AuthModal({
  apiBaseUrl,
  onSuccess,
  onClose,
  className = "",
  labels: labelOverrides,
  theme = "auto",
}: AuthModalProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<UserPayload | null>(null);
  const [pendingIsNewUser, setPendingIsNewUser] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-focus the first input when the step changes
  useEffect(() => {
    if (step === "email") emailRef.current?.focus();
    else digitRefs.current[0]?.focus();
  }, [step]);

  // Trap focus within the modal
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const post = useCallback(
    async (path: string, body: Record<string, string>) => {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        const code =
          typeof json["error"] === "string" ? json["error"] : "UNKNOWN";
        throw new Error(code);
      }
      return json;
    },
    [apiBaseUrl]
  );

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await post("/send-otp", { email });
      setDigits(Array(CODE_LENGTH).fill(""));
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err instanceof Error ? err.message : "UNKNOWN"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const data = await post("/verify-otp", { email, code });
      const token = data["token"] as string;
      const user = data["user"] as UserPayload;
      const isNewUser = data["isNewUser"] as boolean;

      // Backend may signal 2FA is required via a specific field
      if (data["requires2FA"] === true || user.totpEnabled) {
        setPendingToken(token);
        setPendingUser(user);
        setPendingIsNewUser(isNewUser);
        setDigits(Array(CODE_LENGTH).fill(""));
        setStep("twofa");
      } else {
        onSuccess(token, user, isNewUser);
      }
    } catch (err) {
      setError(getErrorMessage(err instanceof Error ? err.message : "UNKNOWN"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const data = await post("/verify-2fa", { email, code });
      const token = (data["token"] as string) ?? pendingToken!;
      const user = (data["user"] as UserPayload) ?? pendingUser!;
      onSuccess(token, user, pendingIsNewUser);
    } catch (err) {
      setError(getErrorMessage(err instanceof Error ? err.message : "UNKNOWN"));
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < CODE_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? "";
    setDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    digitRefs.current[focusIndex]?.focus();
  };

  const themeClass =
    theme === "dark" ? "dark" : theme === "light" ? "" : "dark:bg-zinc-900";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${themeClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-8 mx-4 ${className}`}
      >
        {/* Close button */}
        <button
          id="auth-modal-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
        >
          ✕
        </button>

        {step === "email" && (
          <form onSubmit={handleSendOTP} noValidate>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Sign in
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              We&apos;ll send a one-time code to your email.
            </p>

            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              {labels.emailLabel}
            </label>
            <input
              id="auth-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              aria-label={labels.emailLabel}
              required
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder={labels.emailPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mb-4"
            />

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
                {error}
              </p>
            )}

            <button
              id="auth-send-otp-btn"
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? "Sending…" : labels.sendCodeButton}
            </button>
          </form>
        )}

        {(step === "otp" || step === "twofa") && (
          <form onSubmit={step === "otp" ? handleVerifyOTP : handleVerify2FA} noValidate>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {step === "otp" ? "Check your email" : "Two-factor authentication"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              {step === "otp" ? labels.otpLabel : labels.twoFALabel}
            </p>

            {/* 6-digit code inputs */}
            <fieldset aria-label={step === "otp" ? labels.otpLabel : labels.twoFALabel}>
              <legend className="sr-only">
                {step === "otp" ? labels.otpLabel : labels.twoFALabel}
              </legend>
              <div className="flex gap-2 justify-center mb-4">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    id={`auth-digit-${i}`}
                    ref={(el) => { digitRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={digitInputClass}
                  />
                ))}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3 text-center">
                {error}
              </p>
            )}

            <button
              id="auth-verify-btn"
              type="submit"
              disabled={loading || digits.join("").length < CODE_LENGTH}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors mb-3"
            >
              {loading ? "Verifying…" : step === "otp" ? labels.verifyButton : labels.verifyTwoFAButton}
            </button>

            <button
              id="auth-back-btn"
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setDigits(Array(CODE_LENGTH).fill(""));
              }}
              className="w-full py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              {labels.backButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
