"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthError: () => AuthError,
  MemoryAdapter: () => MemoryAdapter,
  createAuth: () => createAuth
});
module.exports = __toCommonJS(index_exports);

// src/utils/errors.ts
var AuthError = class _AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AuthError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _AuthError);
    }
  }
};

// src/utils/validate.ts
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

// src/utils/crypto.ts
var import_crypto = __toESM(require("crypto"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var BCRYPT_COST = 10;
var GCM_IV_LENGTH = 12;
var GCM_AUTH_TAG_LENGTH = 16;
var AES_KEY_LENGTH = 32;
var BACKUP_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var BACKUP_CODE_LENGTH = 8;
var BACKUP_CODE_COUNT = 8;
function generateOTP(length) {
  const max = Math.pow(10, length);
  const code = import_crypto.default.randomInt(0, max);
  return code.toString().padStart(length, "0");
}
async function hashValue(plaintext) {
  return import_bcryptjs.default.hash(plaintext, BCRYPT_COST);
}
async function compareHash(plaintext, hash) {
  return import_bcryptjs.default.compare(plaintext, hash);
}
function deriveEncryptionKey(jwtSecret) {
  return import_crypto.default.hkdfSync(
    "sha256",
    Buffer.from(jwtSecret, "utf8"),
    Buffer.alloc(0),
    // no salt — key separation is achieved via the `info` param
    Buffer.from("easy-auth-totp-encryption-v1", "utf8"),
    AES_KEY_LENGTH
  );
}
function encryptSecret(plaintext, jwtSecret) {
  const key = deriveEncryptionKey(jwtSecret);
  const iv = import_crypto.default.randomBytes(GCM_IV_LENGTH);
  const cipher = import_crypto.default.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${ciphertext.toString("hex")}:${authTag.toString("hex")}`;
}
function decryptSecret(encrypted, jwtSecret) {
  const [ivHex, ciphertextHex, authTagHex] = encrypted.split(":");
  if (!ivHex || !ciphertextHex || !authTagHex) {
    throw new Error("Malformed encrypted secret");
  }
  const key = deriveEncryptionKey(jwtSecret);
  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex").subarray(0, GCM_AUTH_TAG_LENGTH);
  const decipher = import_crypto.default.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
function generateBackupCodes() {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    let code = "";
    for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
      code += BACKUP_CODE_CHARSET[import_crypto.default.randomInt(BACKUP_CODE_CHARSET.length)];
    }
    return code;
  });
}

// src/utils/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_crypto2 = __toESM(require("crypto"));
var JWT_ALGORITHM = "HS256";
var DEFAULT_EXPIRES_IN = "7d";
function signToken(email, secret, expiresIn = DEFAULT_EXPIRES_IN) {
  const jti = import_crypto2.default.randomUUID();
  return import_jsonwebtoken.default.sign({ jti }, secret, {
    subject: email,
    algorithm: JWT_ALGORITHM,
    expiresIn
  });
}
function verifyToken(token, secret) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, secret, {
      algorithms: [JWT_ALGORITHM]
    });
    return decoded;
  } catch (err) {
    if (err instanceof import_jsonwebtoken.default.TokenExpiredError) {
      throw new AuthError("TOKEN_EXPIRED", "Session token has expired");
    }
    throw new AuthError("TOKEN_INVALID", "Session token is invalid");
  }
}

// src/utils/email.ts
var import_nodemailer = __toESM(require("nodemailer"));
var DEFAULT_SUBJECT = "Your login code";
var DEFAULT_EXPIRY_MINUTES = 10;
function defaultTemplate(code) {
  const text = [
    `Your login code is: ${code}`,
    "",
    `This code expires in ${DEFAULT_EXPIRY_MINUTES} minutes. Do not share it with anyone.`,
    "",
    "If you did not request this code, ignore this email."
  ].join("\n");
  const safeCode = code.replace(/[&<>"']/g, (c) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
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
async function sendOTPEmail(config, email, code) {
  const transport = import_nodemailer.default.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.auth.user,
      pass: config.smtp.auth.pass
    }
  });
  const templateFn = config.email?.templateFn ?? defaultTemplate;
  const { text, html } = templateFn(code);
  await transport.sendMail({
    from: config.smtp.from,
    to: email,
    subject: config.email?.subject ?? DEFAULT_SUBJECT,
    text,
    html
  });
}

// src/utils/totp.ts
var import_crypto3 = __toESM(require("crypto"));
var TOTP_STEP = 30;
var TOTP_WINDOW = 1;
var TOTP_ALGORITHM = "sha1";
var TOTP_DIGITS = 6;
var BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function generateTOTPSecret() {
  const bytes = import_crypto3.default.randomBytes(20);
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of bytes) {
    buffer = buffer << 8 | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_ALPHABET[buffer >> bitsLeft & 31];
    }
  }
  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[buffer << 5 - bitsLeft & 31];
  }
  return result;
}
function base32Decode(encoded) {
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  const bytes = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of cleaned) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    buffer = buffer << 5 | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push(buffer >> bitsLeft & 255);
    }
  }
  return Buffer.from(bytes);
}
function computeTOTP(secret, counter) {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = import_crypto3.default.createHmac(TOTP_ALGORITHM, key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const code = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, "0");
}
function verifyTOTPCode(secret, inputCode) {
  const currentCounter = Math.floor(Date.now() / 1e3 / TOTP_STEP);
  for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
    const expected = computeTOTP(secret, currentCounter + delta);
    const expectedBuf = Buffer.from(expected, "utf8");
    const inputBuf = Buffer.from(inputCode.padEnd(expected.length, "\0"), "utf8");
    if (expectedBuf.length === inputBuf.length && import_crypto3.default.timingSafeEqual(expectedBuf, inputBuf)) {
      return true;
    }
  }
  return false;
}
function buildOTPAuthURI(email, secret, issuer) {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: TOTP_ALGORITHM.toUpperCase(),
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP)
  });
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?${params.toString()}`;
}
async function enrollTOTP(email, store, jwtSecret, issuer) {
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
async function confirmTOTP(email, code, store, jwtSecret) {
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
async function verifyTOTP(email, code, store, jwtSecret) {
  const enabled = await store.getTOTPEnabled(email);
  if (!enabled) {
    throw new AuthError("2FA_NOT_ENROLLED", "TOTP 2FA is not enabled for this account");
  }
  const encryptedSecret = await store.getTOTPSecret(email);
  if (!encryptedSecret) {
    throw new AuthError("2FA_NOT_ENROLLED", "TOTP secret not found despite 2FA being enabled");
  }
  const secret = decryptSecret(encryptedSecret, jwtSecret);
  if (verifyTOTPCode(secret, code)) {
    return;
  }
  const hashed = await hashValue(code);
  const consumed = await store.consumeBackupCode(email, hashed);
  if (consumed) {
    return;
  }
  throw new AuthError("2FA_INVALID", "The TOTP code is invalid");
}

// src/adapters/memory.ts
var MemoryAdapter = class {
  users = /* @__PURE__ */ new Map();
  otps = /* @__PURE__ */ new Map();
  lockouts = /* @__PURE__ */ new Map();
  totp = /* @__PURE__ */ new Map();
  async getUser(email) {
    return this.users.get(email) ?? null;
  }
  async upsertUser(email, metadata) {
    const existing = this.users.get(email);
    const now = Date.now();
    if (existing) {
      const updated = { ...existing, lastLoginAt: now };
      this.users.set(email, updated);
      return updated;
    }
    const newUser = {
      email,
      createdAt: now,
      lastLoginAt: now,
      totpEnabled: false,
      metadata: metadata ?? {}
    };
    this.users.set(email, newUser);
    return newUser;
  }
  async setOTP(email, hashedCode, ttlSeconds) {
    this.otps.set(email, {
      hashedCode,
      attempts: 0,
      expiresAt: Date.now() + ttlSeconds * 1e3
    });
  }
  async getOTP(email) {
    const record = this.otps.get(email);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.otps.delete(email);
      return null;
    }
    return { hashedCode: record.hashedCode, attempts: record.attempts };
  }
  async incrementOTPAttempts(email) {
    const record = this.otps.get(email);
    if (!record) return 0;
    record.attempts += 1;
    return record.attempts;
  }
  async deleteOTP(email) {
    this.otps.delete(email);
  }
  async setLockout(email, untilTimestamp) {
    this.lockouts.set(email, untilTimestamp);
  }
  async getLockout(email) {
    const until = this.lockouts.get(email);
    if (until === void 0) return null;
    if (Date.now() > until) {
      this.lockouts.delete(email);
      return null;
    }
    return until;
  }
  async setTOTPSecret(email, encryptedSecret) {
    const existing = this.totp.get(email);
    this.totp.set(email, {
      encryptedSecret,
      enabled: existing?.enabled ?? false,
      backupCodes: existing?.backupCodes ?? []
    });
  }
  async getTOTPSecret(email) {
    return this.totp.get(email)?.encryptedSecret ?? null;
  }
  async setTOTPEnabled(email, enabled) {
    const existing = this.totp.get(email);
    if (existing) {
      existing.enabled = enabled;
    } else {
      this.totp.set(email, { encryptedSecret: "", enabled, backupCodes: [] });
    }
    const user = this.users.get(email);
    if (user) {
      this.users.set(email, { ...user, totpEnabled: enabled });
    }
  }
  async getTOTPEnabled(email) {
    return this.totp.get(email)?.enabled ?? false;
  }
  async setBackupCodes(email, hashedCodes) {
    const existing = this.totp.get(email);
    if (existing) {
      existing.backupCodes = [...hashedCodes];
    } else {
      this.totp.set(email, {
        encryptedSecret: "",
        enabled: false,
        backupCodes: [...hashedCodes]
      });
    }
  }
  async consumeBackupCode(email, hashedCode) {
    const record = this.totp.get(email);
    if (!record) return false;
    const index = record.backupCodes.indexOf(hashedCode);
    if (index === -1) return false;
    record.backupCodes.splice(index, 1);
    return true;
  }
};

// src/utils/logger.ts
var noopLogger = {
  debug: () => void 0,
  info: () => void 0,
  warn: () => void 0,
  error: () => void 0
};

// src/core.ts
var MIN_JWT_SECRET_LENGTH = 32;
var DEFAULT_OTP_LENGTH = 6;
var DEFAULT_OTP_TTL_SECONDS = 600;
var DEFAULT_MAX_ATTEMPTS = 5;
var DEFAULT_LOCKOUT_SECONDS = 900;
function validateConfig(config) {
  if (config.jwt.secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new AuthError(
      "CONFIG_INVALID",
      `jwt.secret must be at least ${MIN_JWT_SECRET_LENGTH} characters long`
    );
  }
  if (!config.smtp.host || !config.smtp.auth?.user || !config.smtp.auth?.pass || !config.smtp.from) {
    throw new AuthError(
      "CONFIG_INVALID",
      "smtp config is missing required fields: host, auth.user, auth.pass, from"
    );
  }
}
function createAuth(config, logger = noopLogger) {
  validateConfig(config);
  const store = config.store ?? new MemoryAdapter();
  if (!config.store) {
    logger.warn(
      "easy-auth: No storage adapter provided. Using in-memory adapter. All auth state will be lost on process restart. Set config.store for production."
    );
  }
  const otpLength = config.otp?.length ?? DEFAULT_OTP_LENGTH;
  const otpTtlSeconds = config.otp?.ttlSeconds ?? DEFAULT_OTP_TTL_SECONDS;
  const maxAttempts = config.otp?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const lockoutSeconds = config.otp?.lockoutSeconds ?? DEFAULT_LOCKOUT_SECONDS;
  const jwtExpiresIn = config.jwt.expiresIn ?? "7d";
  const jwtSecret = config.jwt.secret;
  async function sendOTP(email) {
    if (!isValidEmail(email)) {
      throw new AuthError("INVALID_EMAIL", "The provided email address is not valid");
    }
    const code = generateOTP(otpLength);
    const hashedCode = await hashValue(code);
    await store.setOTP(email, hashedCode, otpTtlSeconds);
    await sendOTPEmail(config, email, code);
    logger.info("OTP sent", { email });
  }
  async function verifyOTP(email, code) {
    if (!isValidEmail(email)) {
      throw new AuthError("INVALID_EMAIL", "The provided email address is not valid");
    }
    const lockedUntil = await store.getLockout(email);
    if (lockedUntil !== null) {
      throw new AuthError(
        "ACCOUNT_LOCKED",
        "Too many failed attempts. Try again later."
      );
    }
    const otpRecord = await store.getOTP(email);
    if (!otpRecord) {
      throw new AuthError("OTP_EXPIRED", "No valid OTP found. Request a new code.");
    }
    if (otpRecord.attempts >= maxAttempts) {
      const lockUntil = Date.now() + lockoutSeconds * 1e3;
      await store.setLockout(email, lockUntil);
      await store.deleteOTP(email);
      throw new AuthError(
        "OTP_MAX_ATTEMPTS",
        "Maximum verification attempts reached. Account is temporarily locked."
      );
    }
    const isValid = await compareHash(code, otpRecord.hashedCode);
    if (!isValid) {
      const attempts = await store.incrementOTPAttempts(email);
      if (attempts >= maxAttempts) {
        const lockUntil = Date.now() + lockoutSeconds * 1e3;
        await store.setLockout(email, lockUntil);
        await store.deleteOTP(email);
        throw new AuthError(
          "OTP_MAX_ATTEMPTS",
          "Maximum verification attempts reached. Account is temporarily locked."
        );
      }
      throw new AuthError("OTP_INVALID", "The code you entered is incorrect");
    }
    await store.deleteOTP(email);
    const existingUser = await store.getUser(email);
    const isNewUser = existingUser === null;
    const user = await store.upsertUser(email);
    const token = signToken(email, jwtSecret, jwtExpiresIn);
    logger.info("OTP verified", { email, isNewUser });
    return { token, user, isNewUser };
  }
  async function verifyToken2(token) {
    const payload = verifyToken(token, jwtSecret);
    const email = payload.sub;
    const user = await store.getUser(email);
    if (!user) {
      throw new AuthError("TOKEN_INVALID", "User associated with this token no longer exists");
    }
    return user;
  }
  async function enroll2FA(email) {
    const issuerMatch = config.smtp.from.match(/<(.+)>/) ?? [null, config.smtp.from];
    const domain = (issuerMatch[1] ?? config.smtp.from).split("@")[1] ?? "app";
    const { secret, otpauthUri, backupCodes } = await enrollTOTP(
      email,
      store,
      jwtSecret,
      domain
    );
    const qrDataUrl = otpauthUri;
    return { secret, qrDataUrl, backupCodes };
  }
  async function confirm2FA(email, totpCode) {
    await confirmTOTP(email, totpCode, store, jwtSecret);
    logger.info("2FA confirmed", { email });
  }
  async function verify2FA(email, totpCode) {
    await verifyTOTP(email, totpCode, store, jwtSecret);
    logger.info("2FA verified", { email });
  }
  async function revokeUser(email) {
    await store.deleteOTP(email);
    logger.info("User sessions revoked", { email });
  }
  return {
    sendOTP,
    verifyOTP,
    verifyToken: verifyToken2,
    enroll2FA,
    confirm2FA,
    verify2FA,
    revokeUser
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthError,
  MemoryAdapter,
  createAuth
});
//# sourceMappingURL=index.js.map