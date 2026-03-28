/**
 * RFC-5321/5322 simplified regex. Validates the most common email formats
 * without relying on a heavy library. Does NOT cover every edge case —
 * that is the SMTP server's job. This prevents obviously invalid addresses
 * from ever reaching the store or mailer.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Returns true if the email address passes basic format validation.
 *
 * @param email - The string to validate.
 */
export function isValidEmail(email: string): boolean {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}
