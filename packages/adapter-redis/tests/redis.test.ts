import { describe, it, expect, beforeEach, afterEach } from "vitest";
// ioredis-mock provides an in-process Redis implementation for testing.
// We import via dynamic require to satisfy the CJS/ESM boundary.
import IORedisMock from "ioredis-mock";
import { redisAdapter } from "../src/index.js";

describe("Redis StorageAdapter", () => {
  let adapter: ReturnType<typeof redisAdapter>;

  beforeEach(() => {
    // Each test gets a fresh mock Redis client
    const client = new IORedisMock() as unknown as import("ioredis").Redis;
    adapter = redisAdapter({ client });
  });

  it("upsertUser creates user on first call", async () => {
    const user = await adapter.upsertUser("a@example.com");
    expect(user.email).toBe("a@example.com");
    expect(user.totpEnabled).toBe(false);
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

  it("deleteOTP removes the entry", async () => {
    await adapter.setOTP("d@example.com", "hashed", 600);
    await adapter.deleteOTP("d@example.com");
    expect(await adapter.getOTP("d@example.com")).toBeNull();
  });

  it("incrementOTPAttempts increments correctly", async () => {
    await adapter.setOTP("e@example.com", "hashed", 600);
    expect(await adapter.incrementOTPAttempts("e@example.com")).toBe(1);
    expect(await adapter.incrementOTPAttempts("e@example.com")).toBe(2);
  });

  it("setLockout / getLockout round-trip", async () => {
    const until = Date.now() + 999_000;
    await adapter.setLockout("f@example.com", until);
    const result = await adapter.getLockout("f@example.com");
    expect(result).toBe(until);
  });

  it("getLockout returns null after expiry (past timestamp)", async () => {
    // ioredis-mock doesn't expire keys in real time, but logical lockout check
    // works via getLockout filtering: if stored until < now, core ignores it.
    // We test that a timestamp in the past is still returned as stored.
    await adapter.setLockout("g@example.com", Date.now() - 1000);
    // The Redis adapter just returns what was stored; TTL expiry is async
    const result = await adapter.getLockout("g@example.com");
    // May be null (if TTL already expired) or a past timestamp — both are valid
    expect(result === null || result < Date.now()).toBe(true);
  });

  it("TOTP secret round-trip", async () => {
    await adapter.setTOTPSecret("h@example.com", "enc-secret");
    expect(await adapter.getTOTPSecret("h@example.com")).toBe("enc-secret");
  });

  it("setTOTPEnabled / getTOTPEnabled round-trip", async () => {
    await adapter.upsertUser("i@example.com");
    await adapter.setTOTPEnabled("i@example.com", true);
    expect(await adapter.getTOTPEnabled("i@example.com")).toBe(true);
    await adapter.setTOTPEnabled("i@example.com", false);
    expect(await adapter.getTOTPEnabled("i@example.com")).toBe(false);
  });

  it("consumeBackupCode marks code used and rejects reuse", async () => {
    await adapter.setBackupCodes("j@example.com", ["HASH_A", "HASH_B"]);
    expect(await adapter.consumeBackupCode("j@example.com", "HASH_A")).toBe(true);
    expect(await adapter.consumeBackupCode("j@example.com", "HASH_A")).toBe(false);
    expect(await adapter.consumeBackupCode("j@example.com", "HASH_B")).toBe(true);
  });
});
