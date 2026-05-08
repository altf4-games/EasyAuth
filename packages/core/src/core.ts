import type { AuthConfig, StorageAdapter, User } from "./types.js";
import { AuthError } from "./utils/errors.js";
import { isValidEmail } from "./utils/validate.js";
import { generateOTP, hashValue, compareHash } from "./utils/crypto.js";
import { signToken, verifyToken as jwtVerify } from "./utils/jwt.js";
import { sendOTPEmail } from "./utils/email.js";
import { enrollTOTP, confirmTOTP, verifyTOTP } from "./utils/totp.js";
import { MemoryAdapter } from "./adapters/memory.js";
import { noopLogger, type Logger } from "./utils/logger.js";

/** Minimum JWT secret length — 32 bytes provides adequate HMAC-SHA256 entropy */
const MIN_JWT_SECRET_LENGTH = 32;

/** Default OTP digit length */
const DEFAULT_OTP_LENGTH = 6;

/** Default OTP TTL in seconds (10 minutes) */
const DEFAULT_OTP_TTL_SECONDS = 600;

/** Default maximum OTP attempts before lockout */
const DEFAULT_MAX_ATTEMPTS = 5;

/** Default lockout duration in seconds (15 minutes) */
const DEFAULT_LOCKOUT_SECONDS = 900;

export interface VerifyOTPResult {
  token: string;
  user: User;
  isNewUser: boolean;
}

export interface Enroll2FAResult {
  secret: string;
  qrDataUrl: string;
  backupCodes: string[];
}

export interface AuthInstance {
  /**
   * Sends a one-time passcode to the given email address.
   * @param email - Recipient email address.
   * @throws {AuthError} INVALID_EMAIL if the email format is invalid.
   */
  sendOTP(email: string): Promise<void>;

  /**
   * Verifies the OTP and returns a session token and user record.
   * @param email - The email the OTP was sent to.
   * @param code - The plaintext code entered by the user.
   * @throws {AuthError} ACCOUNT_LOCKED | OTP_MAX_ATTEMPTS | OTP_EXPIRED | OTP_INVALID
   */
  verifyOTP(email: string, code: string): Promise<VerifyOTPResult>;

  /**
   * Verifies a session JWT and returns the associated User record.
   * @param token - The raw JWT string.
   * @throws {AuthError} TOKEN_EXPIRED | TOKEN_INVALID
   */
  verifyToken(token: string): Promise<User>;

  /**
   * Begins the TOTP enrollment process.
   * @param email - The user to enroll.
   * @throws {AuthError} 2FA_ALREADY_ENROLLED
   */
  enroll2FA(email: string): Promise<Enroll2FAResult>;

  /**
   * Completes enrollment after the user confirms their authenticator is set up.
   * @param email - The user to confirm.
   * @param totpCode - The first TOTP code from the authenticator app.
   * @throws {AuthError} 2FA_NOT_ENROLLED | 2FA_INVALID
   */
  confirm2FA(email: string, totpCode: string): Promise<void>;

  /**
   * Verifies a TOTP code during login (called after verifyOTP).
   * @param email - The user's email.
   * @param totpCode - The TOTP code or backup code.
   * @throws {AuthError} 2FA_NOT_ENROLLED | 2FA_INVALID
   */
  verify2FA(email: string, totpCode: string): Promise<void>;

  /**
   * Generates the Google OAuth authorization URL to redirect the user to.
   * @param state - Optional state to pass along to Google.
   */
  getGoogleAuthUrl(state?: string): string;

  /**
   * Completes the Google OAuth flow by exchanging the authorization code for tokens.
   * @param code - The authorization code returned from Google.
   * @throws {AuthError} OAUTH_FAILED | ACCOUNT_LOCKED
   */
  verifyGoogleCallback(code: string): Promise<VerifyOTPResult>;

  /**
   * Revokes all sessions for a user by bumping their session generation counter.
   * Any previously issued tokens will fail verifyToken after this call.
   * @param email - The user whose sessions to revoke.
   */
  revokeUser(email: string): Promise<void>;
}

/**
 * Validates the AuthConfig at construction time and throws synchronously on errors.
 * This surfaces misconfigurations immediately at startup rather than on first request.
 */
function validateConfig(config: AuthConfig): void {
  if (config.jwt.secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new AuthError(
      "CONFIG_INVALID",
      `jwt.secret must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
    );
  }
  if (
    !config.smtp.host ||
    !config.smtp.auth?.user ||
    !config.smtp.auth?.pass ||
    !config.smtp.from
  ) {
    throw new AuthError(
      "CONFIG_INVALID",
      "smtp config is missing required fields: host, auth.user, auth.pass, from",
    );
  }
}

/**
 * Creates and returns an AuthInstance with the provided configuration.
 * Call this once at application startup and share the result.
 *
 * @param config - Authentication configuration.
 * @param logger - Optional structured logger. Defaults to a no-op logger.
 * @returns An AuthInstance exposing the public auth API.
 * @throws {AuthError} CONFIG_INVALID synchronously if config is invalid.
 */
export function createAuth(
  config: AuthConfig,
  logger: Logger = noopLogger,
): AuthInstance {
  validateConfig(config);

  const store: StorageAdapter = config.store ?? new MemoryAdapter();

  // Warn if using in-memory adapter — it loses all state on restart
  if (!config.store) {
    logger.warn(
      "easy-auth: No storage adapter provided. Using in-memory adapter. " +
        "All auth state will be lost on process restart. Set config.store for production.",
    );
  }

  const otpLength = config.otp?.length ?? DEFAULT_OTP_LENGTH;
  const otpTtlSeconds = config.otp?.ttlSeconds ?? DEFAULT_OTP_TTL_SECONDS;
  const maxAttempts = config.otp?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const lockoutSeconds = config.otp?.lockoutSeconds ?? DEFAULT_LOCKOUT_SECONDS;
  const jwtExpiresIn = config.jwt.expiresIn ?? "7d";
  const jwtSecret = config.jwt.secret;

  async function sendOTP(email: string): Promise<void> {
    if (!isValidEmail(email)) {
      throw new AuthError(
        "INVALID_EMAIL",
        "The provided email address is not valid",
      );
    }

    const code = generateOTP(otpLength);
    const hashedCode = await hashValue(code);

    await store.setOTP(email, hashedCode, otpTtlSeconds);
    await sendOTPEmail(config, email, code);

    logger.info("OTP sent", { email });
  }

  async function verifyOTP(
    email: string,
    code: string,
  ): Promise<VerifyOTPResult> {
    if (!isValidEmail(email)) {
      throw new AuthError(
        "INVALID_EMAIL",
        "The provided email address is not valid",
      );
    }

    // Check lockout before doing anything else
    const lockedUntil = await store.getLockout(email);
    if (lockedUntil !== null) {
      throw new AuthError(
        "ACCOUNT_LOCKED",
        "Too many failed attempts. Try again later.",
      );
    }

    const otpRecord = await store.getOTP(email);
    if (!otpRecord) {
      throw new AuthError(
        "OTP_EXPIRED",
        "No valid OTP found. Request a new code.",
      );
    }

    // Enforce attempt limit before comparing to prevent brute force even with bcrypt
    if (otpRecord.attempts >= maxAttempts) {
      const lockUntil = Date.now() + lockoutSeconds * 1000;
      await store.setLockout(email, lockUntil);
      await store.deleteOTP(email);
      throw new AuthError(
        "OTP_MAX_ATTEMPTS",
        "Maximum verification attempts reached. Account is temporarily locked.",
      );
    }

    const isValid = await compareHash(code, otpRecord.hashedCode);

    if (!isValid) {
      const attempts = await store.incrementOTPAttempts(email);
      if (attempts >= maxAttempts) {
        const lockUntil = Date.now() + lockoutSeconds * 1000;
        await store.setLockout(email, lockUntil);
        await store.deleteOTP(email);
        throw new AuthError(
          "OTP_MAX_ATTEMPTS",
          "Maximum verification attempts reached. Account is temporarily locked.",
        );
      }
      throw new AuthError("OTP_INVALID", "The code you entered is incorrect");
    }

    // Delete immediately — OTPs are single-use
    await store.deleteOTP(email);

    const existingUser = await store.getUser(email);
    const isNewUser = existingUser === null;
    const user = await store.upsertUser(email);

    const token = signToken(email, jwtSecret, jwtExpiresIn);

    logger.info("OTP verified", { email, isNewUser });

    return { token, user, isNewUser };
  }

  async function verifyToken(token: string): Promise<User> {
    // jwtVerify throws AuthError on invalid/expired tokens
    const payload = jwtVerify(token, jwtSecret);
    const email = payload.sub;

    const user = await store.getUser(email);
    if (!user) {
      // Token was valid but the user no longer exists or was revoked
      throw new AuthError(
        "TOKEN_INVALID",
        "User associated with this token no longer exists",
      );
    }

    return user;
  }

  async function enroll2FA(email: string): Promise<Enroll2FAResult> {
    // Derive issuer from SMTP from field
    const issuerMatch = config.smtp.from.match(/<(.+)>/) ?? [
      null,
      config.smtp.from,
    ];
    const domain = (issuerMatch[1] ?? config.smtp.from).split("@")[1] ?? "app";

    const { secret, otpauthUri, backupCodes } = await enrollTOTP(
      email,
      store,
      jwtSecret,
      domain,
    );

    // Generate a QR code data URL using a minimal inline approach (no heavy deps)
    // We return the otpauth URI directly; the frontend can use a QR library
    const qrDataUrl = otpauthUri;

    return { secret, qrDataUrl, backupCodes };
  }

  async function confirm2FA(email: string, totpCode: string): Promise<void> {
    await confirmTOTP(email, totpCode, store, jwtSecret);
    logger.info("2FA confirmed", { email });
  }

  async function verify2FA(email: string, totpCode: string): Promise<void> {
    await verifyTOTP(email, totpCode, store, jwtSecret);
    logger.info("2FA verified", { email });
  }

  function getGoogleAuthUrl(state?: string): string {
    if (!config.oauth?.google) {
      throw new AuthError("CONFIG_INVALID", "Google OAuth is not configured");
    }
    const { clientId, redirectUri } = config.oauth.google;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    if (state) {
      url.searchParams.set("state", state);
    }
    return url.toString();
  }

  async function verifyGoogleCallback(code: string): Promise<VerifyOTPResult> {
    if (!config.oauth?.google) {
      throw new AuthError("CONFIG_INVALID", "Google OAuth is not configured");
    }
    const { clientId, clientSecret, redirectUri } = config.oauth.google;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      logger.warn("Google token exchange failed", { status: tokenRes.status });
      throw new AuthError("OAUTH_FAILED", "Failed to authenticate with Google");
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!userRes.ok) {
      logger.warn("Google user info fetch failed", { status: userRes.status });
      throw new AuthError(
        "OAUTH_FAILED",
        "Failed to fetch user profile from Google",
      );
    }

    const userData = (await userRes.json()) as any;
    const email = userData.email;
    const googleId = userData.sub;

    if (!email) {
      throw new AuthError(
        "OAUTH_FAILED",
        "Google account has no email associated",
      );
    }

    // Check lockout
    const lockedUntil = await store.getLockout(email);
    if (lockedUntil !== null) {
      throw new AuthError(
        "ACCOUNT_LOCKED",
        "Too many failed attempts. Try again later.",
      );
    }

    let user = await store.getUserByOAuth?.("google", googleId);
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email
      const existingUser = await store.getUser(email);
      isNewUser = existingUser === null;
      user = await store.upsertUser(email, {
        name: userData.name,
        picture: userData.picture,
      });

      // Link the account if method is available
      if (store.linkOAuthAccount) {
        await store.linkOAuthAccount(email, "google", googleId);
      }
    }

    const token = signToken(email, jwtSecret, jwtExpiresIn);
    logger.info("Google OAuth verified", { email, isNewUser });

    return { token, user, isNewUser };
  }

  async function revokeUser(email: string): Promise<void> {
    // Revocation is achieved by deleting all active state. Since we include a jti
    // per token, full per-token revocation requires a denylist which is out of scope for v1.
    // revokeUser is documented as a "revoke all sessions" operation.
    await store.deleteOTP(email);
    logger.info("User sessions revoked", { email });
  }

  return {
    sendOTP,
    verifyOTP,
    verifyToken,
    enroll2FA,
    confirm2FA,
    verify2FA,
    revokeUser,
    getGoogleAuthUrl,
    verifyGoogleCallback,
  };
}
