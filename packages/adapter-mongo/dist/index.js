"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  mongoAdapter: () => mongoAdapter
});
module.exports = __toCommonJS(index_exports);
var import_mongodb = require("mongodb");
async function ensureIndexes(db) {
  await db.collection("otp_state").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, background: true }
  );
  await db.collection("lockouts").createIndex(
    { lockedUntil: 1 },
    { expireAfterSeconds: 0, background: true }
  );
  await db.collection("otp_state").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection("lockouts").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection("totp_secrets").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection("backup_codes").createIndex({ email: 1, hashedCode: 1 }, { background: true });
}
function mongoAdapter(options) {
  const client = new import_mongodb.MongoClient(options.uri);
  let db = null;
  let indexesReady = false;
  async function getDb() {
    if (!db) {
      await client.connect();
      db = client.db(options.dbName);
    }
    if (!indexesReady) {
      await ensureIndexes(db);
      indexesReady = true;
    }
    return db;
  }
  async function col(name) {
    const d = await getDb();
    return d.collection(name);
  }
  return {
    async getUser(email) {
      const users = await col("users");
      const doc = await users.findOne({ email });
      if (!doc) return null;
      return {
        email: doc.email,
        createdAt: doc.createdAt,
        lastLoginAt: doc.lastLoginAt,
        totpEnabled: doc.totpEnabled,
        metadata: doc.metadata
      };
    },
    async upsertUser(email, metadata) {
      const users = await col("users");
      const now = Date.now();
      await users.updateOne(
        { email },
        {
          $setOnInsert: {
            email,
            createdAt: now,
            totpEnabled: false,
            metadata: metadata ?? {}
          },
          $set: { lastLoginAt: now }
        },
        { upsert: true }
      );
      const user = await this.getUser(email);
      return user;
    },
    async setOTP(email, hashedCode, ttlSeconds) {
      const otps = await col("otp_state");
      const expiresAt = new Date(Date.now() + ttlSeconds * 1e3);
      await otps.updateOne(
        { email },
        { $set: { email, hashedCode, attempts: 0, expiresAt } },
        { upsert: true }
      );
    },
    async getOTP(email) {
      const otps = await col("otp_state");
      const doc = await otps.findOne({ email, expiresAt: { $gt: /* @__PURE__ */ new Date() } });
      if (!doc) return null;
      return { hashedCode: doc.hashedCode, attempts: doc.attempts };
    },
    async incrementOTPAttempts(email) {
      const otps = await col("otp_state");
      const result = await otps.findOneAndUpdate(
        { email },
        { $inc: { attempts: 1 } },
        { returnDocument: "after" }
      );
      return result?.attempts ?? 0;
    },
    async deleteOTP(email) {
      const otps = await col("otp_state");
      await otps.deleteOne({ email });
    },
    async setLockout(email, untilTimestamp) {
      const lockouts = await col("lockouts");
      await lockouts.updateOne(
        { email },
        { $set: { email, lockedUntil: new Date(untilTimestamp) } },
        { upsert: true }
      );
    },
    async getLockout(email) {
      const lockouts = await col("lockouts");
      const doc = await lockouts.findOne({ email, lockedUntil: { $gt: /* @__PURE__ */ new Date() } });
      return doc ? doc.lockedUntil.getTime() : null;
    },
    async setTOTPSecret(email, encryptedSecret) {
      const secrets = await col("totp_secrets");
      await secrets.updateOne(
        { email },
        { $set: { email, encryptedSecret } },
        { upsert: true }
      );
    },
    async getTOTPSecret(email) {
      const secrets = await col("totp_secrets");
      const doc = await secrets.findOne({ email });
      return doc?.encryptedSecret ?? null;
    },
    async setTOTPEnabled(email, enabled) {
      const users = await col("users");
      await users.updateOne({ email }, { $set: { totpEnabled: enabled } });
    },
    async getTOTPEnabled(email) {
      const users = await col("users");
      const doc = await users.findOne({ email });
      return doc?.totpEnabled ?? false;
    },
    async setBackupCodes(email, hashedCodes) {
      const codes = await col("backup_codes");
      await codes.deleteMany({ email });
      if (hashedCodes.length > 0) {
        await codes.insertMany(
          hashedCodes.map((hc) => ({ email, hashedCode: hc, used: false }))
        );
      }
    },
    async consumeBackupCode(email, hashedCode) {
      const codes = await col("backup_codes");
      const result = await codes.findOneAndUpdate(
        { email, hashedCode, used: false },
        { $set: { used: true } },
        { returnDocument: "after" }
      );
      return result !== null;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mongoAdapter
});
//# sourceMappingURL=index.js.map