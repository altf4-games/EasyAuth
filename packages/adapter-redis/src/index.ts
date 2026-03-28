import Redis from "ioredis";
import type { StorageAdapter, User } from "@altf4-auth/core";

/** All keys are namespaced to avoid collision with application keys */
const NS = "@altf4-auth/core";

function key(segment: string, email: string): string {
  return `${NS}:${segment}:${email}`;
}

interface RedisAdapterOptions {
  /** Redis connection URL, e.g. "redis://localhost:6379" */
  url?: string;
  /** Or pass an existing ioredis client */
  client?: Redis;
}

/**
 * Creates a Redis-backed StorageAdapter for easy-auth.
 * OTP TTLs use native Redis EXPIRE — no timestamp columns needed.
 * All keys are namespaced under `easy-auth:*`.
 *
 * @param options - Either a connection `url` or an existing ioredis `client`.
 * @returns A StorageAdapter ready to pass to createAuth().
 */
export function redisAdapter(options: RedisAdapterOptions): StorageAdapter {
  const redis = options.client ?? new Redis(options.url ?? "redis://localhost:6379");

  return {
    async getUser(email) {
      const raw = await redis.get(key("user", email));
      if (!raw) return null;
      return JSON.parse(raw) as User;
    },

    async upsertUser(email, metadata) {
      const existing = await this.getUser(email);
      const now = Date.now();
      const user: User = existing
        ? { ...existing, lastLoginAt: now }
        : {
            email,
            createdAt: now,
            lastLoginAt: now,
            totpEnabled: false,
            metadata: metadata ?? {},
          };
      await redis.set(key("user", email), JSON.stringify(user));
      return user;
    },

    async setOTP(email, hashedCode, ttlSeconds) {
      const payload = JSON.stringify({ hashedCode, attempts: 0 });
      await redis.set(key("otp", email), payload, "EX", ttlSeconds);
    },

    async getOTP(email) {
      const raw = await redis.get(key("otp", email));
      if (!raw) return null;
      return JSON.parse(raw) as { hashedCode: string; attempts: number };
    },

    async incrementOTPAttempts(email) {
      const raw = await redis.get(key("otp", email));
      if (!raw) return 0;
      const record = JSON.parse(raw) as { hashedCode: string; attempts: number };
      record.attempts += 1;
      // Preserve remaining TTL when updating attempts
      const ttl = await redis.ttl(key("otp", email));
      const remainingTtl = ttl > 0 ? ttl : 600;
      await redis.set(key("otp", email), JSON.stringify(record), "EX", remainingTtl);
      return record.attempts;
    },

    async deleteOTP(email) {
      await redis.del(key("otp", email));
    },

    async setLockout(email, untilTimestamp) {
      const ttlSeconds = Math.ceil((untilTimestamp - Date.now()) / 1000);
      if (ttlSeconds > 0) {
        await redis.set(key("lockout", email), String(untilTimestamp), "EX", ttlSeconds);
      }
    },

    async getLockout(email) {
      const raw = await redis.get(key("lockout", email));
      if (!raw) return null;
      return parseInt(raw, 10);
    },

    async setTOTPSecret(email, encryptedSecret) {
      await redis.set(key("totp:secret", email), encryptedSecret);
    },

    async getTOTPSecret(email) {
      return redis.get(key("totp:secret", email));
    },

    async setTOTPEnabled(email, enabled) {
      await redis.set(key("totp:enabled", email), enabled ? "1" : "0");
      // Mirror into user object so User.totpEnabled stays current
      const user = await this.getUser(email);
      if (user) {
        await redis.set(
          key("user", email),
          JSON.stringify({ ...user, totpEnabled: enabled })
        );
      }
    },

    async getTOTPEnabled(email) {
      const val = await redis.get(key("totp:enabled", email));
      return val === "1";
    },

    async setBackupCodes(email, hashedCodes) {
      const k = key("totp:backup", email);
      await redis.del(k);
      if (hashedCodes.length > 0) {
        await redis.sadd(k, ...hashedCodes);
      }
    },

    async consumeBackupCode(email, hashedCode) {
      const k = key("totp:backup", email);
      // SREM returns 1 if the member existed and was removed, 0 otherwise
      const removed = await redis.srem(k, hashedCode);
      return removed === 1;
    },
  };
}
