"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthModal: () => AuthModal,
  DEFAULT_LABELS: () => DEFAULT_LABELS,
  getErrorMessage: () => getErrorMessage
});
module.exports = __toCommonJS(index_exports);

// src/AuthModal.tsx
var import_react = require("react");

// src/types.ts
var DEFAULT_LABELS = {
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
  successMessage: "Signed in successfully."
};
var ERROR_MESSAGES = {
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
  UNKNOWN: "Something went wrong. Please try again."
};
function getErrorMessage(code) {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES["UNKNOWN"];
}

// src/AuthModal.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var CODE_LENGTH = 6;
var digitInputClass = "w-10 h-12 text-center text-lg font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 caret-transparent";
function AuthModal({
  apiBaseUrl,
  onSuccess,
  onClose,
  className = "",
  labels: labelOverrides,
  theme = "auto"
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [step, setStep] = (0, import_react.useState)("email");
  const [email, setEmail] = (0, import_react.useState)("");
  const [digits, setDigits] = (0, import_react.useState)(Array(CODE_LENGTH).fill(""));
  const [error, setError] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [pendingToken, setPendingToken] = (0, import_react.useState)(null);
  const [pendingUser, setPendingUser] = (0, import_react.useState)(null);
  const [pendingIsNewUser, setPendingIsNewUser] = (0, import_react.useState)(false);
  const emailRef = (0, import_react.useRef)(null);
  const digitRefs = (0, import_react.useRef)([]);
  const modalRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (step === "email") emailRef.current?.focus();
    else digitRefs.current[0]?.focus();
  }, [step]);
  (0, import_react.useEffect)(() => {
    const handler = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
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
  (0, import_react.useEffect)(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  const post = (0, import_react.useCallback)(
    async (path, body) => {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) {
        const code = typeof json["error"] === "string" ? json["error"] : "UNKNOWN";
        throw new Error(code);
      }
      return json;
    },
    [apiBaseUrl]
  );
  const handleSendOTP = async (e) => {
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
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const data = await post("/verify-otp", { email, code });
      const token = data["token"];
      const user = data["user"];
      const isNewUser = data["isNewUser"];
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
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const data = await post("/verify-2fa", { email, code });
      const token = data["token"] ?? pendingToken;
      const user = data["user"] ?? pendingUser;
      onSuccess(token, user, pendingIsNewUser);
    } catch (err) {
      setError(getErrorMessage(err instanceof Error ? err.message : "UNKNOWN"));
    } finally {
      setLoading(false);
    }
  };
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < CODE_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };
  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? "";
    setDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    digitRefs.current[focusIndex]?.focus();
  };
  const themeClass = theme === "dark" ? "dark" : theme === "light" ? "" : "dark:bg-zinc-900";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Sign in",
      className: `fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${themeClass}`,
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          ref: modalRef,
          className: `relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-8 mx-4 ${className}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                id: "auth-modal-close",
                type: "button",
                "aria-label": "Close",
                onClick: onClose,
                className: "absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-xl leading-none",
                children: "\u2715"
              }
            ),
            step === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { onSubmit: handleSendOTP, noValidate: true, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1", children: "Sign in" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-zinc-500 dark:text-zinc-400 mb-6", children: "We'll send a one-time code to your email." }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "label",
                {
                  htmlFor: "auth-email",
                  className: "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1",
                  children: labels.emailLabel
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  id: "auth-email",
                  ref: emailRef,
                  type: "email",
                  autoComplete: "email",
                  "aria-label": labels.emailLabel,
                  required: true,
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: labels.emailPlaceholder,
                  className: "w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mb-4"
                }
              ),
              error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "alert", className: "text-sm text-red-600 dark:text-red-400 mb-3", children: error }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  id: "auth-send-otp-btn",
                  type: "submit",
                  disabled: loading || !email,
                  className: "w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors",
                  children: loading ? "Sending\u2026" : labels.sendCodeButton
                }
              )
            ] }),
            (step === "otp" || step === "twofa") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { onSubmit: step === "otp" ? handleVerifyOTP : handleVerify2FA, noValidate: true, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1", children: step === "otp" ? "Check your email" : "Two-factor authentication" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-zinc-500 dark:text-zinc-400 mb-6", children: step === "otp" ? labels.otpLabel : labels.twoFALabel }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { "aria-label": step === "otp" ? labels.otpLabel : labels.twoFALabel, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { className: "sr-only", children: step === "otp" ? labels.otpLabel : labels.twoFALabel }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex gap-2 justify-center mb-4", children: digits.map((digit, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    id: `auth-digit-${i}`,
                    ref: (el) => {
                      digitRefs.current[i] = el;
                    },
                    type: "text",
                    inputMode: "numeric",
                    pattern: "\\d*",
                    maxLength: 1,
                    "aria-label": `Digit ${i + 1} of ${CODE_LENGTH}`,
                    value: digit,
                    onChange: (e) => handleDigitChange(i, e.target.value),
                    onKeyDown: (e) => handleDigitKeyDown(i, e),
                    onPaste: i === 0 ? handlePaste : void 0,
                    className: digitInputClass
                  },
                  i
                )) })
              ] }),
              error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "alert", className: "text-sm text-red-600 dark:text-red-400 mb-3 text-center", children: error }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  id: "auth-verify-btn",
                  type: "submit",
                  disabled: loading || digits.join("").length < CODE_LENGTH,
                  className: "w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors mb-3",
                  children: loading ? "Verifying\u2026" : step === "otp" ? labels.verifyButton : labels.verifyTwoFAButton
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  id: "auth-back-btn",
                  type: "button",
                  onClick: () => {
                    setStep("email");
                    setError(null);
                    setDigits(Array(CODE_LENGTH).fill(""));
                  },
                  className: "w-full py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors",
                  children: labels.backButton
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthModal,
  DEFAULT_LABELS,
  getErrorMessage
});
//# sourceMappingURL=index.js.map