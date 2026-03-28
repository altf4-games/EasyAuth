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
  sqliteAdapter: () => sqliteAdapter
});
module.exports = __toCommonJS(index_exports);
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var CURRENT_SCHEMA_VERSION = 1;
var SCHEMA_SQL = `
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
function runMigrations(db) {
  db.exec(SCHEMA_SQL);
  const row = db.prepare("SELECT version FROM schema_version").get();
  if (!row) {
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(
      CURRENT_SCHEMA_VERSION
    );
  }
}
function sqliteAdapter(dbPath) {
  const db = new import_better_sqlite3.default(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return {
    async getUser(email) {
      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!row) return null;
      return {
        email: row.email,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
        totpEnabled: row.totp_enabled === 1,
        metadata: JSON.parse(row.metadata)
      };
    },
    async upsertUser(email, metadata) {
      const existing = db.prepare("SELECT created_at FROM users WHERE email = ?").get(email);
      const now = Date.now();
      if (existing) {
        db.prepare("UPDATE users SET last_login_at = ? WHERE email = ?").run(now, email);
      } else {
        db.prepare(
          "INSERT INTO users (email, created_at, last_login_at, totp_enabled, metadata) VALUES (?, ?, ?, 0, ?)"
        ).run(email, now, now, JSON.stringify(metadata ?? {}));
      }
      return await this.getUser(email);
    },
    async setOTP(email, hashedCode, ttlSeconds) {
      const expiresAt = Date.now() + ttlSeconds * 1e3;
      db.prepare(
        "INSERT INTO otp_state (email, hashed_code, attempts, expires_at) VALUES (?, ?, 0, ?) ON CONFLICT(email) DO UPDATE SET hashed_code = excluded.hashed_code, attempts = 0, expires_at = excluded.expires_at"
      ).run(email, hashedCode, expiresAt);
    },
    async getOTP(email) {
      const row = db.prepare(
        "SELECT hashed_code, attempts FROM otp_state WHERE email = ? AND expires_at > ?"
      ).get(email, Date.now());
      if (!row) return null;
      return { hashedCode: row.hashed_code, attempts: row.attempts };
    },
    async incrementOTPAttempts(email) {
      db.prepare(
        "UPDATE otp_state SET attempts = attempts + 1 WHERE email = ?"
      ).run(email);
      const row = db.prepare("SELECT attempts FROM otp_state WHERE email = ?").get(email);
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
      const row = db.prepare("SELECT locked_until FROM lockouts WHERE email = ? AND locked_until > ?").get(email, Date.now());
      return row?.locked_until ?? null;
    },
    async setTOTPSecret(email, encryptedSecret) {
      db.prepare(
        "INSERT INTO totp_secrets (email, encrypted_secret) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET encrypted_secret = excluded.encrypted_secret"
      ).run(email, encryptedSecret);
    },
    async getTOTPSecret(email) {
      const row = db.prepare("SELECT encrypted_secret FROM totp_secrets WHERE email = ?").get(email);
      return row?.encrypted_secret ?? null;
    },
    async setTOTPEnabled(email, enabled) {
      db.prepare("UPDATE users SET totp_enabled = ? WHERE email = ?").run(
        enabled ? 1 : 0,
        email
      );
    },
    async getTOTPEnabled(email) {
      const row = db.prepare("SELECT totp_enabled FROM users WHERE email = ?").get(email);
      return row?.totp_enabled === 1;
    },
    async setBackupCodes(email, hashedCodes) {
      const insertMany = db.transaction((codes) => {
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
      const rows = db.prepare(
        "SELECT id, hashed_code FROM backup_codes WHERE email = ? AND used = 0"
      ).all(email);
      const match = rows.find((r) => r.hashed_code === hashedCode);
      if (!match) return false;
      db.prepare("UPDATE backup_codes SET used = 1 WHERE id = ?").run(match.id);
      return true;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sqliteAdapter
});
//# sourceMappingURL=index.js.map