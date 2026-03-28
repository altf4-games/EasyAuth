import crypto from "crypto";
import { encryptSecret, decryptSecret, hashValue, compareHash, generateBackupCodes } from "./crypto.js";
import { AuthError } from "./errors.js";
import type { StorageAdapter } from "../types.js";

/** TOTP time step in seconds (RFC 6238 default) */
const TOTP_STEP = 30;

/** TOTP window tolerance — allow 1 step before and after current time to handle clock skew */
const TOTP_WINDOW = 1;

/** TOTP digest algorithm */
const TOTP_ALGORITHM = "sha1";

/** TOTP code length in digits */
const TOTP_DIGITS = 6;

/** Base32 alphabet for encoding TOTP secrets */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generates 20 random bytes and encodes them as a base32 string suitable
 * for use as a TOTP secret. RFC 6238 requires the secret to be at least 16 bytes.
 */
export function generateTOTPSecret(): string {
  const bytes = crypto.randomBytes(20);
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsLeft) & 31];
    }
  }
  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31];
  }
  return result;
}

/**
 * Decodes a base32 string to a Buffer.
 * TOTP authenticator apps encode secrets in base32.
 */
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of cleaned) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

/**
 * Computes a TOTP code for a given secret and time counter.
 * Implements RFC 6238 / RFC 4226 (HOTP).
 *
 * @param secret - Base32-encoded TOTP secret.
 * @param counter - The time counter (Math.floor(Date.now() / 1000 / step)).
 */
function computeTOTP(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac(TOTP_ALGORITHM, key).update(counterBuf).digest();

  // Dynamic truncation per RFC 4226
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Verifies a TOTP code against a plaintext secret, checking the current window
 * plus `TOTP_WINDOW` steps before and after to handle clock skew.
 *
 * @param secret - Plaintext (decrypted) base32 TOTP secret.
 * @param inputCode - The 6-digit code from the user.
 */
export function verifyTOTPCode(secret: string, inputCode: string): boolean {
  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP);
  for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
    const expected = computeTOTP(secret, currentCounter + delta);
    // Use timingSafeEqual to prevent timing attacks
    const expectedBuf = Buffer.from(expected, "utf8");
    const inputBuf = Buffer.from(inputCode.padEnd(expected.length, "\0"), "utf8");
    if (expectedBuf.length === inputBuf.length &&
        crypto.timingSafeEqual(expectedBuf, inputBuf)) {
      return true;
    }
  }
  return false;
}

/**
 * Builds a `otpauth://totp/...` URI for QR code generation.
 * Compatible with Google Authenticator, Authy, and any RFC 6238 app.
 *
 * @param email - The user's email (used as the account label).
 * @param secret - The base32-encoded TOTP secret.
 * @param issuer - The application name shown in the authenticator app.
 */
export function buildOTPAuthURI(
  email: string,
  secret: string,
  issuer: string
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: TOTP_ALGORITHM.toUpperCase(),
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP),
  });
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Enrolls a new TOTP secret for a user: generates the secret, encrypts it,
 * stores it, generates backup codes, and returns the QR code URI and codes.
 *
 * @param email - The user's email.
 * @param store - The storage adapter instance.
 * @param jwtSecret - Used to derive the encryption key.
 * @param issuer - App name shown in authenticator.
 * @throws {AuthError} 2FA_ALREADY_ENROLLED if TOTP is already active.
 */
export async function enrollTOTP(
  email: string,
  store: StorageAdapter,
  jwtSecret: string,
  issuer: string
): Promise<{ secret: string; otpauthUri: string; backupCodes: string[] }> {
  const alreadyEnabled = await store.getTOTPEnabled(email);
  if (alreadyEnabled) {
    throw new AuthError("2FA_ALREADY_ENROLLED", "TOTP 2FA is already enabled for this account");
  }

  const secret = generateTOTPSecret();
  const encrypted = encryptSecret(secret, jwtSecret);
  await store.setTOTPSecret(email, encrypted);

  const plainBackupCodes = generateBackupCodes();
  const hashedBackupCodes = await Promise.all(plainBackupCodes.map(hashValue));
  await store.setBackupCodes(email, hashedBackupCodes);

  const otpauthUri = buildOTPAuthURI(email, secret, issuer);

  return { secret, otpauthUri, backupCodes: plainBackupCodes };
}

/**
 * Confirms TOTP enrollment by verifying the first code from the authenticator app.
 * Enables TOTP only if the code is correct.
 *
 * @param email - The user's email.
 * @param code - The 6-digit TOTP code from the authenticator.
 * @param store - The storage adapter.
 * @param jwtSecret - Used to decrypt the stored secret.
 * @throws {AuthError} 2FA_NOT_ENROLLED if no secret is pending.
 * @throws {AuthError} 2FA_INVALID if the code does not match.
 */
export async function confirmTOTP(
  email: string,
  code: string,
  store: StorageAdapter,
  jwtSecret: string
): Promise<void> {
  const encryptedSecret = await store.getTOTPSecret(email);
  if (!encryptedSecret) {
    throw new AuthError("2FA_NOT_ENROLLED", "No TOTP secret found. Call enroll2FA first.");
  }

  const secret = decryptSecret(encryptedSecret, jwtSecret);
  if (!verifyTOTPCode(secret, code)) {
    throw new AuthError("2FA_INVALID", "The TOTP code is invalid");
  }

  await store.setTOTPEnabled(email, true);
}

/**
 * Verifies a TOTP code for an already-enrolled user during login.
 *
 * @param email - The user's email.
 * @param code - The 6-digit TOTP code.
 * @param store - The storage adapter.
 * @param jwtSecret - Used to decrypt the stored secret.
 * @throws {AuthError} 2FA_NOT_ENROLLED if TOTP is not enabled.
 * @throws {AuthError} 2FA_INVALID if the code does not match.
 */
export async function verifyTOTP(
  email: string,
  code: string,
  store: StorageAdapter,
  jwtSecret: string
): Promise<void> {
  const enabled = await store.getTOTPEnabled(email);
  if (!enabled) {
    throw new AuthError("2FA_NOT_ENROLLED", "TOTP 2FA is not enabled for this account");
  }

  const encryptedSecret = await store.getTOTPSecret(email);
  if (!encryptedSecret) {
    throw new AuthError("2FA_NOT_ENROLLED", "TOTP secret not found despite 2FA being enabled");
  }

  const secret = decryptSecret(encryptedSecret, jwtSecret);

  // Check regular TOTP code first
  if (verifyTOTPCode(secret, code)) {
    return;
  }

  // Fall through to backup code check
  const hashed = await hashValue(code);
  const consumed = await store.consumeBackupCode(email, hashed);
  if (consumed) {
    return;
  }

  throw new AuthError("2FA_INVALID", "The TOTP code is invalid");
}
