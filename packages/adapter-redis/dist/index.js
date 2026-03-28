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
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
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
  redisAdapter: () => redisAdapter
});
module.exports = __toCommonJS(index_exports);
var import_ioredis = __toESM(require("ioredis"));
var NS = "easy-auth";
function key(segment, email) {
  return `${NS}:${segment}:${email}`;
}
function redisAdapter(options) {
  const redis = options.client ?? new import_ioredis.default(options.url ?? "redis://localhost:6379");
  return {
    async getUser(email) {
      const raw = await redis.get(key("user", email));
      if (!raw) return null;
      return JSON.parse(raw);
    },
    async upsertUser(email, metadata) {
      const existing = await this.getUser(email);
      const now = Date.now();
      const user = existing ? { ...existing, lastLoginAt: now } : {
        email,
        createdAt: now,
        lastLoginAt: now,
        totpEnabled: false,
        metadata: metadata ?? {}
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
      return JSON.parse(raw);
    },
    async incrementOTPAttempts(email) {
      const raw = await redis.get(key("otp", email));
      if (!raw) return 0;
      const record = JSON.parse(raw);
      record.attempts += 1;
      const ttl = await redis.ttl(key("otp", email));
      const remainingTtl = ttl > 0 ? ttl : 600;
      await redis.set(key("otp", email), JSON.stringify(record), "EX", remainingTtl);
      return record.attempts;
    },
    async deleteOTP(email) {
      await redis.del(key("otp", email));
    },
    async setLockout(email, untilTimestamp) {
      const ttlSeconds = Math.ceil((untilTimestamp - Date.now()) / 1e3);
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
      const removed = await redis.srem(k, hashedCode);
      return removed === 1;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  redisAdapter
});
//# sourceMappingURL=index.js.map