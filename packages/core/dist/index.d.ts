/**
 * User record matching the schema required by EasyAuth
 */
interface User {
    email: string;
    createdAt: number;
    lastLoginAt: number;
    totpEnabled: boolean;
    metadata: Record<string, unknown>;
}
/**
 * StorageAdapter interface that all persistence layer implementations must fullfil
 */
interface StorageAdapter {
    getUser(email: string): Promise<User | null>;
    upsertUser(email: string, metadata?: Record<string, unknown>): Promise<User>;
    setOTP(email: string, hashedCode: string, ttlSeconds: number): Promise<void>;
    getOTP(email: string): Promise<{
        hashedCode: string;
        attempts: number;
    } | null>;
    incrementOTPAttempts(email: string): Promise<number>;
    deleteOTP(email: string): Promise<void>;
    setLockout(email: string, untilTimestamp: number): Promise<void>;
    getLockout(email: string): Promise<number | null>;
    setTOTPSecret(email: string, encryptedSecret: string): Promise<void>;
    getTOTPSecret(email: string): Promise<string | null>;
    setTOTPEnabled(email: string, enabled: boolean): Promise<void>;
    getTOTPEnabled(email: string): Promise<boolean>;
    setBackupCodes(email: string, hashedCodes: string[]): Promise<void>;
    consumeBackupCode(email: string, hashedCode: string): Promise<boolean>;
}
/**
 * Configuration for the Auth instance
 */
interface AuthConfig {
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        from: string;
    };
    jwt: {
        secret: string;
        expiresIn?: string;
    };
    otp?: {
        length?: number;
        ttlSeconds?: number;
        maxAttempts?: number;
        lockoutSeconds?: number;
    };
    store?: StorageAdapter;
    email?: {
        subject?: string;
        templateFn?: (code: string) => {
            text: string;
            html: string;
        };
    };
}
type AuthErrorCode = "INVALID_EMAIL" | "OTP_EXPIRED" | "OTP_INVALID" | "OTP_MAX_ATTEMPTS" | "ACCOUNT_LOCKED" | "TOKEN_INVALID" | "TOKEN_EXPIRED" | "2FA_NOT_ENROLLED" | "2FA_INVALID" | "2FA_ALREADY_ENROLLED" | "CONFIG_INVALID";

/**
 * Minimal structured logger interface. Library code emits nothing by default.
 * Developers can inject their own logger (winston, pino, etc.) via config if needed.
 */
interface Logger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}

interface VerifyOTPResult {
    token: string;
    user: User;
    isNewUser: boolean;
}
interface Enroll2FAResult {
    secret: string;
    qrDataUrl: string;
    backupCodes: string[];
}
interface AuthInstance {
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
     * Revokes all sessions for a user by bumping their session generation counter.
     * Any previously issued tokens will fail verifyToken after this call.
     * @param email - The user whose sessions to revoke.
     */
    revokeUser(email: string): Promise<void>;
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
declare function createAuth(config: AuthConfig, logger?: Logger): AuthInstance;

/**
 * Standard AuthError used across the EasyAuth package
 */
declare class AuthError extends Error {
    readonly code: AuthErrorCode;
    constructor(code: AuthErrorCode, message: string);
}

/**
 * In-memory storage adapter for development and testing.
 * WARNING: All data is lost on process restart. Not suitable for production.
 * On startup, easy-auth will log a warning when this adapter is used implicitly.
 */
declare class MemoryAdapter implements StorageAdapter {
    private users;
    private otps;
    private lockouts;
    private totp;
    getUser(email: string): Promise<User | null>;
    upsertUser(email: string, metadata?: Record<string, unknown>): Promise<User>;
    setOTP(email: string, hashedCode: string, ttlSeconds: number): Promise<void>;
    getOTP(email: string): Promise<{
        hashedCode: string;
        attempts: number;
    } | null>;
    incrementOTPAttempts(email: string): Promise<number>;
    deleteOTP(email: string): Promise<void>;
    setLockout(email: string, untilTimestamp: number): Promise<void>;
    getLockout(email: string): Promise<number | null>;
    setTOTPSecret(email: string, encryptedSecret: string): Promise<void>;
    getTOTPSecret(email: string): Promise<string | null>;
    setTOTPEnabled(email: string, enabled: boolean): Promise<void>;
    getTOTPEnabled(email: string): Promise<boolean>;
    setBackupCodes(email: string, hashedCodes: string[]): Promise<void>;
    consumeBackupCode(email: string, hashedCode: string): Promise<boolean>;
}

export { type AuthConfig, AuthError, type AuthErrorCode, type AuthInstance, type Enroll2FAResult, MemoryAdapter, type StorageAdapter, type User, type VerifyOTPResult, createAuth };
