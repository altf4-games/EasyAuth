import crypto from "crypto";
import bcrypt from "bcryptjs";

/** bcrypt cost factor — 10 is the OWASP recommended minimum for interactive logins */
const BCRYPT_COST = 10;

/** AES-256-GCM IV length in bytes */
const GCM_IV_LENGTH = 12;

/** AES-256-GCM auth tag length in bytes */
const GCM_AUTH_TAG_LENGTH = 16;

/** HKDF output length for AES-256 — 32 bytes = 256 bits */
const AES_KEY_LENGTH = 32;

/** Backup code character set — alphanumeric, no ambiguous chars (0/O, 1/l) */
const BACKUP_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Backup code length in characters */
const BACKUP_CODE_LENGTH = 8;

/** Number of backup codes to generate per enrollment */
const BACKUP_CODE_COUNT = 8;

/**
 * Generates a cryptographically secure numeric OTP string of the requested length.
 * Uses `crypto.randomInt` exclusively — never Math.random.
 *
 * @param length - Number of digits in the OTP.
 * @returns A zero-padded numeric string.
 */
export function generateOTP(length: number): string {
  const max = Math.pow(10, length);
  const code = crypto.randomInt(0, max);
  return code.toString().padStart(length, "0");
}

/**
 * Hashes a plaintext value with bcrypt.
 *
 * @param plaintext - The value to hash (e.g. OTP code or backup code).
 * @returns The bcrypt hash string.
 */
export async function hashValue(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

/**
 * Compares a plaintext value against a stored bcrypt hash.
 * bcrypt.compare is timing-safe by design.
 *
 * @param plaintext - The raw input value.
 * @param hash - The stored bcrypt hash to compare against.
 * @returns True if the plaintext matches the hash.
 */
export async function compareHash(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Derives a 256-bit AES key from the JWT secret using HKDF with SHA-256.
 * We derive rather than use the secret directly to maintain key separation.
 *
 * @param jwtSecret - The raw JWT secret string from config.
 * @returns A Buffer suitable as an AES-256 key.
 */
function deriveEncryptionKey(jwtSecret: string): Buffer {
  return crypto.hkdfSync(
    "sha256",
    Buffer.from(jwtSecret, "utf8"),
    Buffer.alloc(0), // no salt — key separation is achieved via the `info` param
    Buffer.from("easy-auth-totp-encryption-v1", "utf8"),
    AES_KEY_LENGTH
  );
}

/**
 * Encrypts a TOTP secret string using AES-256-GCM.
 * Output format: `<iv_hex>:<ciphertext_hex>:<authTag_hex>`
 *
 * @param plaintext - The base32 TOTP secret to encrypt.
 * @param jwtSecret - The JWT secret used to derive the encryption key.
 * @returns The encrypted string suitable for storage.
 */
export function encryptSecret(plaintext: string, jwtSecret: string): string {
  const key = deriveEncryptionKey(jwtSecret);
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${ciphertext.toString("hex")}:${authTag.toString("hex")}`;
}

/**
 * Decrypts a TOTP secret that was encrypted with `encryptSecret`.
 *
 * @param encrypted - The stored encrypted string in `<iv>:<ciphertext>:<authTag>` format.
 * @param jwtSecret - The JWT secret used to derive the decryption key.
 * @returns The original plaintext TOTP secret.
 */
export function decryptSecret(encrypted: string, jwtSecret: string): string {
  const [ivHex, ciphertextHex, authTagHex] = encrypted.split(":");
  if (!ivHex || !ciphertextHex || !authTagHex) {
    throw new Error("Malformed encrypted secret");
  }

  const key = deriveEncryptionKey(jwtSecret);
  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex").subarray(0, GCM_AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * Generates the specified number of backup codes.
 * Each code is `BACKUP_CODE_LENGTH` alphanumeric characters from a disambiguated charset.
 *
 * @returns An array of plaintext backup code strings (not yet hashed).
 */
export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    let code = "";
    for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
      code += BACKUP_CODE_CHARSET[crypto.randomInt(BACKUP_CODE_CHARSET.length)];
    }
    return code;
  });
}
