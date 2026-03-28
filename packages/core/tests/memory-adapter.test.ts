import { describe, it, expect } from "vitest";
import { MemoryAdapter } from "../src/adapters/memory.js";
import { hashValue } from "../src/utils/crypto.js";

describe("MemoryAdapter", () => {
  it("upsertUser creates user on first call", async () => {
    const adapter = new MemoryAdapter();
    const user = await adapter.upsertUser("a@example.com");
    expect(user.email).toBe("a@example.com");
    expect(user.totpEnabled).toBe(false);
    expect(user.createdAt).toBeGreaterThan(0);
  });

  it("upsertUser updates lastLoginAt on subsequent calls", async () => {
    const adapter = new MemoryAdapter();
    const first = await adapter.upsertUser("a@example.com");
    await new Promise((r) => setTimeout(r, 5));
    const second = await adapter.upsertUser("a@example.com");
    expect(second.lastLoginAt).toBeGreaterThanOrEqual(first.lastLoginAt);
  });

  it("setOTP / getOTP round-trip", async () => {
    const adapter = new MemoryAdapter();
    const hashed = await hashValue("123456");
    await adapter.setOTP("b@example.com", hashed, 600);
    const record = await adapter.getOTP("b@example.com");
    expect(record).not.toBeNull();
    expect(record?.hashedCode).toBe(hashed);
    expect(record?.attempts).toBe(0);
  });

  it("getOTP returns null for expired OTPs", async () => {
    const adapter = new MemoryAdapter();
    const hashed = await hashValue("123456");
    // TTL of 0 means already expired
    await adapter.setOTP("c@example.com", hashed, 0);
    // A brief wait to ensure time has passed
    await new Promise((r) => setTimeout(r, 10));
    const record = await adapter.getOTP("c@example.com");
    expect(record).toBeNull();
  });

  it("deleteOTP removes the entry", async () => {
    const adapter = new MemoryAdapter();
    const hashed = await hashValue("123456");
    await adapter.setOTP("d@example.com", hashed, 600);
    await adapter.deleteOTP("d@example.com");
    expect(await adapter.getOTP("d@example.com")).toBeNull();
  });

  it("incrementOTPAttempts increments correctly", async () => {
    const adapter = new MemoryAdapter();
    const hashed = await hashValue("123456");
    await adapter.setOTP("e@example.com", hashed, 600);
    expect(await adapter.incrementOTPAttempts("e@example.com")).toBe(1);
    expect(await adapter.incrementOTPAttempts("e@example.com")).toBe(2);
  });

  it("setLockout / getLockout round-trip", async () => {
    const adapter = new MemoryAdapter();
    const until = Date.now() + 999_999;
    await adapter.setLockout("f@example.com", until);
    expect(await adapter.getLockout("f@example.com")).toBe(until);
  });

  it("getLockout returns null after expiry", async () => {
    const adapter = new MemoryAdapter();
    // lockout already in the past
    await adapter.setLockout("g@example.com", Date.now() - 1000);
    expect(await adapter.getLockout("g@example.com")).toBeNull();
  });

  it("TOTP methods round-trip", async () => {
    const adapter = new MemoryAdapter();
    await adapter.setTOTPSecret("h@example.com", "encrypted-secret");
    expect(await adapter.getTOTPSecret("h@example.com")).toBe("encrypted-secret");

    await adapter.setTOTPEnabled("h@example.com", true);
    expect(await adapter.getTOTPEnabled("h@example.com")).toBe(true);

    await adapter.setTOTPEnabled("h@example.com", false);
    expect(await adapter.getTOTPEnabled("h@example.com")).toBe(false);
  });

  it("consumeBackupCode marks code used and rejects reuse", async () => {
    const adapter = new MemoryAdapter();
    const codes = ["HASH1", "HASH2", "HASH3"];
    await adapter.setBackupCodes("i@example.com", codes);

    expect(await adapter.consumeBackupCode("i@example.com", "HASH1")).toBe(true);
    expect(await adapter.consumeBackupCode("i@example.com", "HASH1")).toBe(false);
    expect(await adapter.consumeBackupCode("i@example.com", "HASH2")).toBe(true);
  });
});
