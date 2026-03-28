import type { StorageAdapter, User } from "../types.js";

interface OTPRecord {
  hashedCode: string;
  attempts: number;
  expiresAt: number;
}

interface TOTPRecord {
  encryptedSecret: string;
  enabled: boolean;
  backupCodes: string[];
}

/**
 * In-memory storage adapter for development and testing.
 * WARNING: All data is lost on process restart. Not suitable for production.
 * On startup, easy-auth will log a warning when this adapter is used implicitly.
 */
export class MemoryAdapter implements StorageAdapter {
  private users = new Map<string, User>();
  private otps = new Map<string, OTPRecord>();
  private lockouts = new Map<string, number>();
  private totp = new Map<string, TOTPRecord>();

  async getUser(email: string): Promise<User | null> {
    return this.users.get(email) ?? null;
  }

  async upsertUser(
    email: string,
    metadata?: Record<string, unknown>
  ): Promise<User> {
    const existing = this.users.get(email);
    const now = Date.now();
    if (existing) {
      const updated: User = { ...existing, lastLoginAt: now };
      this.users.set(email, updated);
      return updated;
    }
    const newUser: User = {
      email,
      createdAt: now,
      lastLoginAt: now,
      totpEnabled: false,
      metadata: metadata ?? {},
    };
    this.users.set(email, newUser);
    return newUser;
  }

  async setOTP(
    email: string,
    hashedCode: string,
    ttlSeconds: number
  ): Promise<void> {
    this.otps.set(email, {
      hashedCode,
      attempts: 0,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getOTP(
    email: string
  ): Promise<{ hashedCode: string; attempts: number } | null> {
    const record = this.otps.get(email);
    if (!record) return null;
    // Enforce TTL in the adapter layer
    if (Date.now() > record.expiresAt) {
      this.otps.delete(email);
      return null;
    }
    return { hashedCode: record.hashedCode, attempts: record.attempts };
  }

  async incrementOTPAttempts(email: string): Promise<number> {
    const record = this.otps.get(email);
    if (!record) return 0;
    record.attempts += 1;
    return record.attempts;
  }

  async deleteOTP(email: string): Promise<void> {
    this.otps.delete(email);
  }

  async setLockout(email: string, untilTimestamp: number): Promise<void> {
    this.lockouts.set(email, untilTimestamp);
  }

  async getLockout(email: string): Promise<number | null> {
    const until = this.lockouts.get(email);
    if (until === undefined) return null;
    // Auto-clean expired lockouts
    if (Date.now() > until) {
      this.lockouts.delete(email);
      return null;
    }
    return until;
  }

  async setTOTPSecret(email: string, encryptedSecret: string): Promise<void> {
    const existing = this.totp.get(email);
    this.totp.set(email, {
      encryptedSecret,
      enabled: existing?.enabled ?? false,
      backupCodes: existing?.backupCodes ?? [],
    });
  }

  async getTOTPSecret(email: string): Promise<string | null> {
    return this.totp.get(email)?.encryptedSecret ?? null;
  }

  async setTOTPEnabled(email: string, enabled: boolean): Promise<void> {
    const existing = this.totp.get(email);
    if (existing) {
      existing.enabled = enabled;
    } else {
      this.totp.set(email, { encryptedSecret: "", enabled, backupCodes: [] });
    }
    // Mirror into users map so User.totpEnabled stays in sync
    const user = this.users.get(email);
    if (user) {
      this.users.set(email, { ...user, totpEnabled: enabled });
    }
  }

  async getTOTPEnabled(email: string): Promise<boolean> {
    return this.totp.get(email)?.enabled ?? false;
  }

  async setBackupCodes(email: string, hashedCodes: string[]): Promise<void> {
    const existing = this.totp.get(email);
    if (existing) {
      existing.backupCodes = [...hashedCodes];
    } else {
      this.totp.set(email, {
        encryptedSecret: "",
        enabled: false,
        backupCodes: [...hashedCodes],
      });
    }
  }

  async consumeBackupCode(
    email: string,
    hashedCode: string
  ): Promise<boolean> {
    const record = this.totp.get(email);
    if (!record) return false;
    const index = record.backupCodes.indexOf(hashedCode);
    if (index === -1) return false;
    // Remove the code so it cannot be reused
    record.backupCodes.splice(index, 1);
    return true;
  }
}
