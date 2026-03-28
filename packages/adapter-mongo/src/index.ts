import { MongoClient, type Db, type Collection } from "mongodb";
import type { StorageAdapter, User } from "easy-auth";

interface MongoAdapterOptions {
  uri: string;
  dbName: string;
}

interface OTPDoc {
  email: string;
  hashedCode: string;
  attempts: number;
  expiresAt: Date;
}

interface LockoutDoc {
  email: string;
  lockedUntil: Date;
}

interface TOTPSecretDoc {
  email: string;
  encryptedSecret: string;
}

interface BackupCodeDoc {
  email: string;
  hashedCode: string;
  used: boolean;
}

/**
 * Ensures all indexes exist. Called once on first connection.
 * Idempotent — safe to call multiple times.
 */
async function ensureIndexes(db: Db): Promise<void> {
  // TTL index: MongoDB automatically deletes documents when expiresAt passes
  await db.collection<OTPDoc>("otp_state").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, background: true }
  );
  await db.collection<LockoutDoc>("lockouts").createIndex(
    { lockedUntil: 1 },
    { expireAfterSeconds: 0, background: true }
  );
  await db.collection<OTPDoc>("otp_state").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection<LockoutDoc>("lockouts").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection<TOTPSecretDoc>("totp_secrets").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection<BackupCodeDoc>("backup_codes").createIndex({ email: 1, hashedCode: 1 }, { background: true });
}

/**
 * Creates a MongoDB-backed StorageAdapter for easy-auth.
 * Uses the official mongodb driver (not Mongoose).
 * All indexes are created on first connect, idempotently.
 * OTP TTL is handled via a MongoDB TTL index on the expiresAt field.
 *
 * @param options - Connection uri and database name.
 * @returns A StorageAdapter ready to pass to createAuth().
 */
export function mongoAdapter(options: MongoAdapterOptions): StorageAdapter {
  const client = new MongoClient(options.uri);
  let db: Db | null = null;
  let indexesReady = false;

  async function getDb(): Promise<Db> {
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

  async function col<T extends object>(name: string): Promise<Collection<T>> {
    const d = await getDb();
    return d.collection<T>(name);
  }

  return {
    async getUser(email) {
      const users = await col<User & { _id?: unknown }>("users");
      const doc = await users.findOne({ email });
      if (!doc) return null;
      return {
        email: doc.email,
        createdAt: doc.createdAt,
        lastLoginAt: doc.lastLoginAt,
        totpEnabled: doc.totpEnabled,
        metadata: doc.metadata,
      };
    },

    async upsertUser(email, metadata) {
      const users = await col<User>("users");
      const now = Date.now();
      await users.updateOne(
        { email },
        {
          $setOnInsert: {
            email,
            createdAt: now,
            totpEnabled: false,
            metadata: metadata ?? {},
          },
          $set: { lastLoginAt: now },
        },
        { upsert: true }
      );
      const user = await this.getUser(email);
      return user as User;
    },

    async setOTP(email, hashedCode, ttlSeconds) {
      const otps = await col<OTPDoc>("otp_state");
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await otps.updateOne(
        { email },
        { $set: { email, hashedCode, attempts: 0, expiresAt } },
        { upsert: true }
      );
    },

    async getOTP(email) {
      const otps = await col<OTPDoc>("otp_state");
      const doc = await otps.findOne({ email, expiresAt: { $gt: new Date() } });
      if (!doc) return null;
      return { hashedCode: doc.hashedCode, attempts: doc.attempts };
    },

    async incrementOTPAttempts(email) {
      const otps = await col<OTPDoc>("otp_state");
      const result = await otps.findOneAndUpdate(
        { email },
        { $inc: { attempts: 1 } },
        { returnDocument: "after" }
      );
      return result?.attempts ?? 0;
    },

    async deleteOTP(email) {
      const otps = await col<OTPDoc>("otp_state");
      await otps.deleteOne({ email });
    },

    async setLockout(email, untilTimestamp) {
      const lockouts = await col<LockoutDoc>("lockouts");
      await lockouts.updateOne(
        { email },
        { $set: { email, lockedUntil: new Date(untilTimestamp) } },
        { upsert: true }
      );
    },

    async getLockout(email) {
      const lockouts = await col<LockoutDoc>("lockouts");
      const doc = await lockouts.findOne({ email, lockedUntil: { $gt: new Date() } });
      return doc ? doc.lockedUntil.getTime() : null;
    },

    async setTOTPSecret(email, encryptedSecret) {
      const secrets = await col<TOTPSecretDoc>("totp_secrets");
      await secrets.updateOne(
        { email },
        { $set: { email, encryptedSecret } },
        { upsert: true }
      );
    },

    async getTOTPSecret(email) {
      const secrets = await col<TOTPSecretDoc>("totp_secrets");
      const doc = await secrets.findOne({ email });
      return doc?.encryptedSecret ?? null;
    },

    async setTOTPEnabled(email, enabled) {
      const users = await col<User>("users");
      await users.updateOne({ email }, { $set: { totpEnabled: enabled } });
    },

    async getTOTPEnabled(email) {
      const users = await col<User>("users");
      const doc = await users.findOne({ email });
      return doc?.totpEnabled ?? false;
    },

    async setBackupCodes(email, hashedCodes) {
      const codes = await col<BackupCodeDoc>("backup_codes");
      await codes.deleteMany({ email });
      if (hashedCodes.length > 0) {
        await codes.insertMany(
          hashedCodes.map((hc) => ({ email, hashedCode: hc, used: false }))
        );
      }
    },

    async consumeBackupCode(email, hashedCode) {
      const codes = await col<BackupCodeDoc>("backup_codes");
      const result = await codes.findOneAndUpdate(
        { email, hashedCode, used: false },
        { $set: { used: true } },
        { returnDocument: "after" }
      );
      return result !== null;
    },
  };
}
