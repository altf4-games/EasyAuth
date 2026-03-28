import Database from "better-sqlite3";
import type { StorageAdapter, User } from "easy-auth";

/** Extended adapter with lifecycle methods for resource cleanup */
export interface SQLiteAdapter extends StorageAdapter {
  /** Close the underlying database connection. Call this on process exit or in test teardown. */
  close(): void;
}

/** Schema version — bump this when adding migrations */
const CURRENT_SCHEMA_VERSION = 1;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  email         TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL,
  totp_enabled  INTEGER NOT NULL DEFAULT 0,
  metadata      TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS otp_state (
  email        TEXT PRIMARY KEY,
  hashed_code  TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  expires_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lockouts (
  email        TEXT PRIMARY KEY,
  locked_until INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS totp_secrets (
  email            TEXT PRIMARY KEY,
  encrypted_secret TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_codes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL,
  hashed_code  TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);
`;

/**
 * Runs schema creation and idempotent migrations.
 * Uses a schema_version table to track applied migrations.
 */
function runMigrations(db: Database.Database): void {
  db.exec(SCHEMA_SQL);

  const row = db.prepare("SELECT version FROM schema_version").get() as
    | { version: number }
    | undefined;

  if (!row) {
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(
      CURRENT_SCHEMA_VERSION
    );
  }
  // Future migrations: if (row.version < 2) { ... }
}

/**
 * Creates a SQLite-backed StorageAdapter for easy-auth.
 * Uses better-sqlite3 (synchronous, no connection pool needed).
 * WAL mode is enabled for better concurrent read performance.
 *
 * @param dbPath - Path to the SQLite database file (e.g. "./auth.db").
 * @returns A StorageAdapter ready to pass to createAuth().
 */
export function sqliteAdapter(dbPath: string): SQLiteAdapter {
  const db = new Database(dbPath);

  // WAL mode reduces lock contention when multiple reads happen concurrently
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  return {
    async getUser(email) {
      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
        | {
            email: string;
            created_at: number;
            last_login_at: number;
            totp_enabled: number;
            metadata: string;
          }
        | undefined;
      if (!row) return null;
      return {
        email: row.email,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
        totpEnabled: row.totp_enabled === 1,
        metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      };
    },

    async upsertUser(email, metadata) {
      const existing = db.prepare("SELECT created_at FROM users WHERE email = ?").get(email) as
        | { created_at: number }
        | undefined;
      const now = Date.now();
      if (existing) {
        db.prepare("UPDATE users SET last_login_at = ? WHERE email = ?").run(now, email);
      } else {
        db.prepare(
          "INSERT INTO users (email, created_at, last_login_at, totp_enabled, metadata) VALUES (?, ?, ?, 0, ?)"
        ).run(email, now, now, JSON.stringify(metadata ?? {}));
      }
      return (await this.getUser(email)) as User;
    },

    async setOTP(email, hashedCode, ttlSeconds) {
      const expiresAt = Date.now() + ttlSeconds * 1000;
      db.prepare(
        "INSERT INTO otp_state (email, hashed_code, attempts, expires_at) VALUES (?, ?, 0, ?) ON CONFLICT(email) DO UPDATE SET hashed_code = excluded.hashed_code, attempts = 0, expires_at = excluded.expires_at"
      ).run(email, hashedCode, expiresAt);
    },

    async getOTP(email) {
      const row = db
        .prepare(
          "SELECT hashed_code, attempts FROM otp_state WHERE email = ? AND expires_at > ?"
        )
        .get(email, Date.now()) as
        | { hashed_code: string; attempts: number }
        | undefined;
      if (!row) return null;
      return { hashedCode: row.hashed_code, attempts: row.attempts };
    },

    async incrementOTPAttempts(email) {
      // Use a two-step pattern: read current, write incremented value.
      // RETURNING is a SQLite 3.35+ feature; we keep this compatible with older versions.
      db.prepare(
        "UPDATE otp_state SET attempts = attempts + 1 WHERE email = ?"
      ).run(email);
      const row = db
        .prepare("SELECT attempts FROM otp_state WHERE email = ?")
        .get(email) as { attempts: number } | undefined;
      return row?.attempts ?? 0;
    },

    async deleteOTP(email) {
      db.prepare("DELETE FROM otp_state WHERE email = ?").run(email);
    },

    async setLockout(email, untilTimestamp) {
      db.prepare(
        "INSERT INTO lockouts (email, locked_until) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET locked_until = excluded.locked_until"
      ).run(email, untilTimestamp);
    },

    async getLockout(email) {
      const row = db
        .prepare("SELECT locked_until FROM lockouts WHERE email = ? AND locked_until > ?")
        .get(email, Date.now()) as { locked_until: number } | undefined;
      return row?.locked_until ?? null;
    },

    async setTOTPSecret(email, encryptedSecret) {
      db.prepare(
        "INSERT INTO totp_secrets (email, encrypted_secret) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET encrypted_secret = excluded.encrypted_secret"
      ).run(email, encryptedSecret);
    },

    async getTOTPSecret(email) {
      const row = db
        .prepare("SELECT encrypted_secret FROM totp_secrets WHERE email = ?")
        .get(email) as { encrypted_secret: string } | undefined;
      return row?.encrypted_secret ?? null;
    },

    async setTOTPEnabled(email, enabled) {
      db.prepare("UPDATE users SET totp_enabled = ? WHERE email = ?").run(
        enabled ? 1 : 0,
        email
      );
    },

    async getTOTPEnabled(email) {
      const row = db
        .prepare("SELECT totp_enabled FROM users WHERE email = ?")
        .get(email) as { totp_enabled: number } | undefined;
      return row?.totp_enabled === 1;
    },

    async setBackupCodes(email, hashedCodes) {
      const insertMany = db.transaction((codes: string[]) => {
        db.prepare("DELETE FROM backup_codes WHERE email = ?").run(email);
        const insert = db.prepare(
          "INSERT INTO backup_codes (email, hashed_code, used) VALUES (?, ?, 0)"
        );
        for (const code of codes) {
          insert.run(email, code);
        }
      });
      insertMany(hashedCodes);
    },

    close() {
      db.close();
    },

    async consumeBackupCode(email, hashedCode) {
      const rows = db
        .prepare(
          "SELECT id, hashed_code FROM backup_codes WHERE email = ? AND used = 0"
        )
        .all(email) as { id: number; hashed_code: string }[];
      const match = rows.find((r) => r.hashed_code === hashedCode);
      if (!match) return false;
      db.prepare("UPDATE backup_codes SET used = 1 WHERE id = ?").run(match.id);
      return true;
    },
  };
}
