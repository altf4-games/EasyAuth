import { describe, it, expect } from "vitest";
import { isValidEmail } from "../src/utils/validate.js";
import { generateOTP, hashValue, compareHash, encryptSecret, decryptSecret, generateBackupCodes } from "../src/utils/crypto.js";
import { noopLogger } from "../src/utils/logger.js";

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user+tag@sub.domain.io")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("user@domain.c")).toBe(false);
  });
});

describe("generateOTP", () => {
  it("generates a string of the requested length", () => {
    expect(generateOTP(6)).toHaveLength(6);
    expect(generateOTP(8)).toHaveLength(8);
  });

  it("generates only digits", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOTP(6)).toMatch(/^\d+$/);
    }
  });
});

describe("hashValue / compareHash", () => {
  it("hashes differ from plaintext", async () => {
    const hash = await hashValue("secret");
    expect(hash).not.toBe("secret");
  });

  it("compareHash returns true for matching plaintext", async () => {
    const hash = await hashValue("mycode");
    expect(await compareHash("mycode", hash)).toBe(true);
  });

  it("compareHash returns false for wrong plaintext", async () => {
    const hash = await hashValue("mycode");
    expect(await compareHash("wrongcode", hash)).toBe(false);
  });
});

describe("encryptSecret / decryptSecret", () => {
  const secret = "test-secret-value-that-is-long-enough-32chars";

  it("round-trips: decrypt(encrypt(x)) === x", () => {
    const plaintext = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptSecret(plaintext, secret);
    expect(decryptSecret(encrypted, secret)).toBe(plaintext);
  });

  it("produces different ciphertexts on each call (random IV)", () => {
    const plaintext = "JBSWY3DPEHPK3PXP";
    const a = encryptSecret(plaintext, secret);
    const b = encryptSecret(plaintext, secret);
    expect(a).not.toBe(b);
  });

  it("throws when decrypting with wrong key", () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP", secret);
    expect(() => decryptSecret(encrypted, "different-secret-that-is-long-enough-x")).toThrow();
  });
});

describe("generateBackupCodes", () => {
  it("generates exactly 8 codes", () => {
    expect(generateBackupCodes()).toHaveLength(8);
  });

  it("each code is 8 chars from the allowed charset", () => {
    generateBackupCodes().forEach((code) => {
      expect(code).toMatch(/^[A-Z2-9]{8}$/);
    });
  });
});

describe("noopLogger", () => {
  it("all methods exist and do not throw", () => {
    expect(() => noopLogger.debug("msg")).not.toThrow();
    expect(() => noopLogger.info("msg")).not.toThrow();
    expect(() => noopLogger.warn("msg")).not.toThrow();
    expect(() => noopLogger.error("msg")).not.toThrow();
  });
});
