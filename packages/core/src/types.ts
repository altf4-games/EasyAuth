/**
 * User record matching the schema required by EasyAuth
 */
export interface User {
  email: string;
  createdAt: number;
  lastLoginAt: number;
  totpEnabled: boolean;
  metadata: Record<string, unknown>;
}

/**
 * StorageAdapter interface that all persistence layer implementations must fullfil
 */
export interface StorageAdapter {
  // User operations
  getUser(email: string): Promise<User | null>;
  upsertUser(email: string, metadata?: Record<string, unknown>): Promise<User>;

  // OTP operations
  setOTP(email: string, hashedCode: string, ttlSeconds: number): Promise<void>;
  getOTP(email: string): Promise<{ hashedCode: string; attempts: number } | null>;
  incrementOTPAttempts(email: string): Promise<number>;
  deleteOTP(email: string): Promise<void>;

  // Lockout
  setLockout(email: string, untilTimestamp: number): Promise<void>;
  getLockout(email: string): Promise<number | null>;

  // 2FA
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
export interface AuthConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
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
    templateFn?: (code: string) => { text: string; html: string };
  };
}

export type AuthErrorCode =
  | "INVALID_EMAIL"
  | "OTP_EXPIRED"
  | "OTP_INVALID"
  | "OTP_MAX_ATTEMPTS"
  | "ACCOUNT_LOCKED"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "2FA_NOT_ENROLLED"
  | "2FA_INVALID"
  | "2FA_ALREADY_ENROLLED"
  | "CONFIG_INVALID";
