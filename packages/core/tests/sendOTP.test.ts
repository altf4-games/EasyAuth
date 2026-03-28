import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthError } from "../src/utils/errors.js";
import { createTestAuth } from "./helpers.js";

// Mock the email sender so no real SMTP connections are made
vi.mock("../src/utils/email.js", () => ({
  sendOTPEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("sendOTP", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolves without error when given a valid address", async () => {
    const { auth } = createTestAuth();
    await expect(auth.sendOTP("user@example.com")).resolves.not.toThrow();
  });

  it("rejects an invalid email format with INVALID_EMAIL", async () => {
    const { auth } = createTestAuth();
    await expect(auth.sendOTP("not-an-email")).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_EMAIL" })
    );
  });

  it("rejects empty string email with INVALID_EMAIL", async () => {
    const { auth } = createTestAuth();
    await expect(auth.sendOTP("")).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_EMAIL" })
    );
  });

  it("stores a hashed code that differs from plaintext", async () => {
    const { auth, store } = createTestAuth();
    // Capture the plaintext code from the email call
    const { sendOTPEmail } = await import("../src/utils/email.js");
    let captured = "";
    vi.mocked(sendOTPEmail).mockImplementation(async (_c, _e, code) => {
      captured = code;
    });

    await auth.sendOTP("user@example.com");

    const stored = await store.getOTP("user@example.com");
    expect(stored).not.toBeNull();
    if (stored && captured) {
      expect(stored.hashedCode).not.toBe(captured);
    }
  });

  it("generates a 6-digit code by default", async () => {
    const { auth } = createTestAuth();
    const codes: string[] = [];
    const { sendOTPEmail } = await import("../src/utils/email.js");
    vi.mocked(sendOTPEmail).mockImplementation(async (_c, _e, code) => {
      codes.push(code);
    });

    await auth.sendOTP("user@example.com");
    expect(codes[0]).toMatch(/^\d{6}$/);
  });

  it("replaces a pending OTP with a fresh one on resend", async () => {
    const { auth, store } = createTestAuth();
    await auth.sendOTP("user@example.com");
    const first = await store.getOTP("user@example.com");

    await auth.sendOTP("user@example.com");
    const second = await store.getOTP("user@example.com");

    expect(second).not.toBeNull();
    // Attempts reset to 0 for newly issued OTP
    expect(second?.attempts).toBe(0);
    // A new hash was stored (very likely different from the old one)
    expect(second?.hashedCode).not.toBe(first?.hashedCode);
  });
});
