import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthError } from "../src/utils/errors.js";
import { MemoryAdapter } from "../src/adapters/memory.js";
import { createTestAuth } from "./helpers.js";
import { hashValue } from "../src/utils/crypto.js";

/**
 * Seeds a valid OTP directly into the adapter so we can test verifyOTP
 * without relying on the sendOTP email flow.
 */
async function seedOTP(
  store: MemoryAdapter,
  email: string,
  code: string,
  ttlSeconds = 600
) {
  const hashed = await hashValue(code);
  await store.setOTP(email, hashed, ttlSeconds);
}

describe("verifyOTP", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns isNewUser: true for a first-time email", async () => {
    const { auth, store } = createTestAuth();
    await seedOTP(store, "new@example.com", "123456");

    const result = await auth.verifyOTP("new@example.com", "123456");
    expect(result.isNewUser).toBe(true);
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe("new@example.com");
  });

  it("returns isNewUser: false for a returning email", async () => {
    const { auth, store } = createTestAuth();
    // Seed user as existing
    await store.upsertUser("existing@example.com");
    await seedOTP(store, "existing@example.com", "123456");

    const result = await auth.verifyOTP("existing@example.com", "123456");
    expect(result.isNewUser).toBe(false);
  });

  it("rejects with OTP_INVALID for a wrong code", async () => {
    const { auth, store } = createTestAuth();
    await seedOTP(store, "user@example.com", "123456");

    await expect(auth.verifyOTP("user@example.com", "999999")).rejects.toThrow(
      expect.objectContaining({ code: "OTP_INVALID" })
    );
  });

  it("rejects with OTP_EXPIRED when there is no OTP in the store", async () => {
    const { auth } = createTestAuth();

    await expect(auth.verifyOTP("user@example.com", "123456")).rejects.toThrow(
      expect.objectContaining({ code: "OTP_EXPIRED" })
    );
  });

  it("rejects with ACCOUNT_LOCKED when lockout is active", async () => {
    const { auth, store } = createTestAuth();
    await seedOTP(store, "locked@example.com", "123456");
    // Set lockout far in the future
    await store.setLockout("locked@example.com", Date.now() + 999_999);

    await expect(auth.verifyOTP("locked@example.com", "123456")).rejects.toThrow(
      expect.objectContaining({ code: "ACCOUNT_LOCKED" })
    );
  });

  it("increments attempt count on each failure", async () => {
    const { auth, store } = createTestAuth();
    await seedOTP(store, "user@example.com", "123456");

    await expect(auth.verifyOTP("user@example.com", "000000")).rejects.toThrow();
    const otpRecord = await store.getOTP("user@example.com");
    expect(otpRecord?.attempts).toBe(1);

    await expect(auth.verifyOTP("user@example.com", "000000")).rejects.toThrow();
    const otpRecord2 = await store.getOTP("user@example.com");
    expect(otpRecord2?.attempts).toBe(2);
  });

  it("sets lockout after maxAttempts failures", async () => {
    // maxAttempts is 5 by default
    const { auth, store } = createTestAuth();
    await seedOTP(store, "user@example.com", "123456");

    for (let i = 0; i < 5; i++) {
      await auth.verifyOTP("user@example.com", "000000").catch(() => undefined);
    }

    const lockout = await store.getLockout("user@example.com");
    expect(lockout).not.toBeNull();
    expect(lockout!).toBeGreaterThan(Date.now());
  });

  it("deletes the OTP on success so it cannot be reused", async () => {
    const { auth, store } = createTestAuth();
    await seedOTP(store, "user@example.com", "123456");

    await auth.verifyOTP("user@example.com", "123456");

    const remaining = await store.getOTP("user@example.com");
    expect(remaining).toBeNull();
  });

  it("updates lastLoginAt on success", async () => {
    const { auth, store } = createTestAuth();
    const before = Date.now();
    await seedOTP(store, "user@example.com", "123456");
    await auth.verifyOTP("user@example.com", "123456");

    const user = await store.getUser("user@example.com");
    expect(user?.lastLoginAt).toBeGreaterThanOrEqual(before);
  });

  it("rejects INVALID_EMAIL for bad email", async () => {
    const { auth } = createTestAuth();
    await expect(auth.verifyOTP("bad-email", "123456")).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_EMAIL" })
    );
  });
});
