import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sqliteAdapter, type SQLiteAdapter } from "../src/index.js";
import os from "os";
import path from "path";
import fs from "fs";

function tmpDbPath() {
  return path.join(os.tmpdir(), `easy-auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
}

describe("SQLite StorageAdapter", () => {
  let adapter: SQLiteAdapter;
  let dbPath: string;

  beforeEach(() => {
    dbPath = tmpDbPath();
    adapter = sqliteAdapter(dbPath);
  });

  afterEach(() => {
    // Close the database first — better-sqlite3 holds a file lock while open
    adapter.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      try { fs.unlinkSync(`${dbPath}${suffix}`); } catch { /* temp file, ignore */ }
    }
  });


  it("upsertUser creates user on first call", async () => {
    const user = await adapter.upsertUser("a@example.com");
    expect(user.email).toBe("a@example.com");
    expect(user.totpEnabled).toBe(false);
    expect(user.createdAt).toBeGreaterThan(0);
  });

  it("upsertUser updates lastLoginAt on subsequent calls", async () => {
    const first = await adapter.upsertUser("b@example.com");
    await new Promise((r) => setTimeout(r, 5));
    const second = await adapter.upsertUser("b@example.com");
    expect(second.lastLoginAt).toBeGreaterThanOrEqual(first.lastLoginAt);
    expect(second.createdAt).toBe(first.createdAt);
  });

  it("getUser returns null for unknown email", async () => {
    expect(await adapter.getUser("unknown@example.com")).toBeNull();
  });

  it("setOTP / getOTP round-trip", async () => {
    await adapter.setOTP("c@example.com", "hashed", 600);
    const otp = await adapter.getOTP("c@example.com");
    expect(otp?.hashedCode).toBe("hashed");
    expect(otp?.attempts).toBe(0);
  });

  it("getOTP returns null for expired OTPs", async () => {
    await adapter.setOTP("d@example.com", "hashed", 0);
    await new Promise((r) => setTimeout(r, 10));
    expect(await adapter.getOTP("d@example.com")).toBeNull();
  });

  it("deleteOTP removes the entry", async () => {
    await adapter.setOTP("e@example.com", "hashed", 600);
    await adapter.deleteOTP("e@example.com");
    expect(await adapter.getOTP("e@example.com")).toBeNull();
  });

  it("incrementOTPAttempts increments correctly", async () => {
    await adapter.setOTP("f@example.com", "hashed", 600);
    expect(await adapter.incrementOTPAttempts("f@example.com")).toBe(1);
    expect(await adapter.incrementOTPAttempts("f@example.com")).toBe(2);
  });

  it("setLockout / getLockout round-trip", async () => {
    const until = Date.now() + 999_000;
    await adapter.setLockout("g@example.com", until);
    expect(await adapter.getLockout("g@example.com")).toBe(until);
  });

  it("getLockout returns null after expiry", async () => {
    await adapter.setLockout("h@example.com", Date.now() - 1000);
    expect(await adapter.getLockout("h@example.com")).toBeNull();
  });

  it("TOTP secret round-trip", async () => {
    await adapter.upsertUser("i@example.com");
    await adapter.setTOTPSecret("i@example.com", "enc-secret");
    expect(await adapter.getTOTPSecret("i@example.com")).toBe("enc-secret");
  });

  it("setTOTPEnabled / getTOTPEnabled round-trip", async () => {
    await adapter.upsertUser("j@example.com");
    await adapter.setTOTPEnabled("j@example.com", true);
    expect(await adapter.getTOTPEnabled("j@example.com")).toBe(true);
    await adapter.setTOTPEnabled("j@example.com", false);
    expect(await adapter.getTOTPEnabled("j@example.com")).toBe(false);
  });

  it("consumeBackupCode marks code used and rejects reuse", async () => {
    await adapter.upsertUser("k@example.com");
    await adapter.setBackupCodes("k@example.com", ["HASH_A", "HASH_B"]);
    expect(await adapter.consumeBackupCode("k@example.com", "HASH_A")).toBe(true);
    expect(await adapter.consumeBackupCode("k@example.com", "HASH_A")).toBe(false);
    expect(await adapter.consumeBackupCode("k@example.com", "HASH_B")).toBe(true);
  });

  it("setOTP replacement resets attempts", async () => {
    await adapter.setOTP("l@example.com", "hash1", 600);
    await adapter.incrementOTPAttempts("l@example.com");
    await adapter.setOTP("l@example.com", "hash2", 600);
    const otp = await adapter.getOTP("l@example.com");
    expect(otp?.attempts).toBe(0);
    expect(otp?.hashedCode).toBe("hash2");
  });
});
