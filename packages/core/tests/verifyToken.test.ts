import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthError } from "../src/utils/errors.js";
import { createTestAuth, TEST_JWT_SECRET } from "./helpers.js";
import { signToken } from "../src/utils/jwt.js";
import { hashValue } from "../src/utils/crypto.js";

describe("verifyToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the User for a valid token", async () => {
    const { auth, store } = createTestAuth();
    await store.upsertUser("user@example.com");
    // Seed OTP and verify to get a token
    const hashed = await hashValue("123456");
    await store.setOTP("user@example.com", hashed, 600);
    const { token } = await auth.verifyOTP("user@example.com", "123456");

    const user = await auth.verifyToken(token);
    expect(user.email).toBe("user@example.com");
  });

  it("throws TOKEN_EXPIRED for an expired token", async () => {
    const { auth, store } = createTestAuth();
    await store.upsertUser("user@example.com");
    // Sign a token with -1s expiry (already expired)
    const expired = signToken("user@example.com", TEST_JWT_SECRET, "-1s");

    await expect(auth.verifyToken(expired)).rejects.toThrow(
      expect.objectContaining({ code: "TOKEN_EXPIRED" })
    );
  });

  it("throws TOKEN_INVALID for a tampered token", async () => {
    const { auth } = createTestAuth();
    const tampered = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalidsig";

    await expect(auth.verifyToken(tampered)).rejects.toThrow(
      expect.objectContaining({ code: "TOKEN_INVALID" })
    );
  });

  it("throws TOKEN_INVALID for a token signed with a different secret", async () => {
    const { auth, store } = createTestAuth();
    await store.upsertUser("user@example.com");
    const wrongSecret = "a-completely-different-secret-that-is-long-enough";
    const foreignToken = signToken("user@example.com", wrongSecret);

    await expect(auth.verifyToken(foreignToken)).rejects.toThrow(
      expect.objectContaining({ code: "TOKEN_INVALID" })
    );
  });

  it("throws TOKEN_INVALID when user no longer exists", async () => {
    const { auth } = createTestAuth();
    // Token for user that doesn't exist in the store
    const token = signToken("ghost@example.com", TEST_JWT_SECRET);

    await expect(auth.verifyToken(token)).rejects.toThrow(
      expect.objectContaining({ code: "TOKEN_INVALID" })
    );
  });
});
