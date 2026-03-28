import nodemailer from "nodemailer";
import type { AuthConfig } from "../types.js";

/** Default email subject */
const DEFAULT_SUBJECT = "Your login code";

/** Default expiry notice in minutes */
const DEFAULT_EXPIRY_MINUTES = 10;

/**
 * Builds the default plain text email body.
 * No marketing language, no images — just the code and instructions.
 */
function defaultTemplate(code: string): { text: string; html: string } {
  const text = [
    `Your login code is: ${code}`,
    "",
    `This code expires in ${DEFAULT_EXPIRY_MINUTES} minutes. Do not share it with anyone.`,
    "",
    "If you did not request this code, ignore this email.",
  ].join("\n");

  // Minimal HTML — we intentionally avoid complex templates to remove XSS risk.
  // The code is plain numeric and safe, but we still escape defensively.
  const safeCode = code.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c] ?? c;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Login Code</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <p>Your login code is: <strong>${safeCode}</strong></p>
  <p>This code expires in ${DEFAULT_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p>
  <p>If you did not request this code, ignore this email.</p>
</body>
</html>`;

  return { text, html };
}

/**
 * Sends an OTP email via SMTP.
 *
 * @param config - The AuthConfig containing SMTP and email settings.
 * @param email - Recipient email address.
 * @param code - The plaintext OTP code to include in the email.
 */
export async function sendOTPEmail(
  config: AuthConfig,
  email: string,
  code: string
): Promise<void> {
  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.auth.user,
      pass: config.smtp.auth.pass,
    },
  });

  const templateFn = config.email?.templateFn ?? defaultTemplate;
  const { text, html } = templateFn(code);

  await transport.sendMail({
    from: config.smtp.from,
    to: email,
    subject: config.email?.subject ?? DEFAULT_SUBJECT,
    text,
    html,
  });
}
