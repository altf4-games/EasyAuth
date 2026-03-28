import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthError } from "../src/utils/errors.js";
import { createTestAuth } from "./helpers.js";

describe("2FA flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getAuthWithUser(email: string) {
    const ctx = createTestAuth();
    await ctx.store.upsertUser(email);
    return ctx;
  }

  it("enroll2FA returns a secret, a QR URI (data URL), and 8 backup codes", async () => {
    const { auth } = await getAuthWithUser("user@example.com");
    const result = await auth.enroll2FA("user@example.com");

    expect(result.secret).toBeTruthy();
    expect(result.qrDataUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(result.backupCodes).toHaveLength(8);
    // Each backup code: 8 alphanumeric characters
    result.backupCodes.forEach((code) => {
      expect(code).toMatch(/^[A-Z2-9]{8}$/);
    });
  });

  it("enroll2FA throws 2FA_ALREADY_ENROLLED if TOTP is already enabled", async () => {
    const { auth, store } = await getAuthWithUser("user@example.com");
    await auth.enroll2FA("user@example.com");
    await store.setTOTPEnabled("user@example.com", true);

    await expect(auth.enroll2FA("user@example.com")).rejects.toThrow(
      expect.objectContaining({ code: "2FA_ALREADY_ENROLLED" })
    );
  });

  it("confirm2FA throws 2FA_NOT_ENROLLED if no secret is pending", async () => {
    const { auth } = await getAuthWithUser("user@example.com");

    await expect(auth.confirm2FA("user@example.com", "123456")).rejects.toThrow(
      expect.objectContaining({ code: "2FA_NOT_ENROLLED" })
    );
  });

  it("confirm2FA throws 2FA_INVALID when given wrong TOTP code", async () => {
    const { auth } = await getAuthWithUser("user@example.com");
    await auth.enroll2FA("user@example.com");

    await expect(auth.confirm2FA("user@example.com", "000000")).rejects.toThrow(
      expect.objectContaining({ code: "2FA_INVALID" })
    );
  });

  it("verify2FA throws 2FA_NOT_ENROLLED when TOTP is not enabled", async () => {
    const { auth } = await getAuthWithUser("user@example.com");

    await expect(auth.verify2FA("user@example.com", "123456")).rejects.toThrow(
      expect.objectContaining({ code: "2FA_NOT_ENROLLED" })
    );
  });

  it("verify2FA throws 2FA_INVALID for wrong TOTP code when enrolled", async () => {
    const { auth, store } = await getAuthWithUser("user@example.com");
    await auth.enroll2FA("user@example.com");
    await store.setTOTPEnabled("user@example.com", true);

    await expect(auth.verify2FA("user@example.com", "000000")).rejects.toThrow(
      expect.objectContaining({ code: "2FA_INVALID" })
    );
  });

  it("consumeBackupCode works once per code and fails on reuse", async () => {
    const { auth, store } = await getAuthWithUser("user@example.com");
    await auth.enroll2FA("user@example.com");
    await store.setTOTPEnabled("user@example.com", true);

    // enroll2FA already hashes and stores the backup codes in the adapter.
    // We need to retrieve the raw stored hashes to call consumeBackupCode directly.
    // We do this by calling setBackupCodes with known values and then consuming them.
    const knownHash = "KNOWN_HASH_FOR_TEST";
    await store.setBackupCodes("user@example.com", [knownHash, "OTHER_HASH"]);

    const firstUse = await store.consumeBackupCode("user@example.com", knownHash);
    expect(firstUse).toBe(true);

    const reuse = await store.consumeBackupCode("user@example.com", knownHash);
    expect(reuse).toBe(false);
  });
});
