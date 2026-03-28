import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAuth } from "../src/core.js";
import { AuthError } from "../src/utils/errors.js";
import { createTestAuth, TEST_JWT_SECRET } from "./helpers.js";
import { MemoryAdapter } from "../src/adapters/memory.js";

describe("createAuth — config validation", () => {
  it("throws CONFIG_INVALID synchronously when jwt.secret is under 32 chars", () => {
    expect(() =>
      createAuth({
        smtp: { host: "localhost", port: 25, secure: false, auth: { user: "u", pass: "p" }, from: "a@b.com" },
        jwt: { secret: "short" },
      })
    ).toThrow(AuthError);

    expect(() =>
      createAuth({
        smtp: { host: "localhost", port: 25, secure: false, auth: { user: "u", pass: "p" }, from: "a@b.com" },
        jwt: { secret: "short" },
      })
    ).toThrowError(expect.objectContaining({ code: "CONFIG_INVALID" }));
  });

  it("throws CONFIG_INVALID when smtp host is missing", () => {
    expect(() =>
      createAuth({
        smtp: { host: "", port: 25, secure: false, auth: { user: "u", pass: "p" }, from: "a@b.com" },
        jwt: { secret: TEST_JWT_SECRET },
      })
    ).toThrowError(expect.objectContaining({ code: "CONFIG_INVALID" }));
  });

  it("throws CONFIG_INVALID when smtp from is missing", () => {
    expect(() =>
      createAuth({
        smtp: { host: "localhost", port: 25, secure: false, auth: { user: "u", pass: "p" }, from: "" },
        jwt: { secret: TEST_JWT_SECRET },
      })
    ).toThrowError(expect.objectContaining({ code: "CONFIG_INVALID" }));
  });

  it("does not throw when config is valid", () => {
    expect(() => createTestAuth().auth).not.toThrow();
  });
});
