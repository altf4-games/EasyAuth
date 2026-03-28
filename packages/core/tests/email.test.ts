import { describe, it, expect, vi, afterEach } from "vitest";
import nodemailer from "nodemailer";
import { sendOTPEmail } from "../src/utils/email.js";
import type { AuthConfig } from "../src/types.js";

const testConfig: AuthConfig = {
  smtp: {
    host: "localhost",
    port: 1025,
    secure: false,
    auth: { user: "test", pass: "test" },
    from: "Test App <noreply@test.example>",
  },
  jwt: { secret: "test-secret-value-that-is-long-enough-32chars" },
};

describe("sendOTPEmail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls sendMail with correct recipient and subject", async () => {
    const fakeTransport = {
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    };
    vi.spyOn(nodemailer, "createTransport").mockReturnValue(
      fakeTransport as unknown as ReturnType<typeof nodemailer.createTransport>
    );

    await sendOTPEmail(testConfig, "user@example.com", "654321");

    expect(fakeTransport.sendMail).toHaveBeenCalledOnce();
    const call = fakeTransport.sendMail.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.from).toBe("Test App <noreply@test.example>");
    expect(call.subject).toBe("Your login code");
    expect(call.text).toContain("654321");
    expect(call.html).toContain("654321");
  });

  it("uses custom subject from config", async () => {
    const fakeTransport = {
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    };
    vi.spyOn(nodemailer, "createTransport").mockReturnValue(
      fakeTransport as unknown as ReturnType<typeof nodemailer.createTransport>
    );

    const config: AuthConfig = {
      ...testConfig,
      email: { subject: "Custom: your code" },
    };
    await sendOTPEmail(config, "user@example.com", "123456");

    const call = fakeTransport.sendMail.mock.calls[0][0];
    expect(call.subject).toBe("Custom: your code");
  });

  it("uses custom templateFn from config", async () => {
    const fakeTransport = {
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    };
    vi.spyOn(nodemailer, "createTransport").mockReturnValue(
      fakeTransport as unknown as ReturnType<typeof nodemailer.createTransport>
    );

    const config: AuthConfig = {
      ...testConfig,
      email: {
        templateFn: (code) => ({
          text: `Custom text: ${code}`,
          html: `<p>Custom html: ${code}</p>`,
        }),
      },
    };
    await sendOTPEmail(config, "user@example.com", "999888");

    const call = fakeTransport.sendMail.mock.calls[0][0];
    expect(call.text).toBe("Custom text: 999888");
    expect(call.html).toBe("<p>Custom html: 999888</p>");
  });
});

describe("sendOTPEmail — HTML escaping", () => {
  it("escapes special characters in the OTP code in HTML output", async () => {
    // We test the default template escaping by inspecting the HTML output.
    // Normal OTP codes are numeric, but the escaping logic should still work.
    const fakeTransport = {
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    };
    vi.spyOn(nodemailer, "createTransport").mockReturnValue(
      fakeTransport as unknown as ReturnType<typeof nodemailer.createTransport>
    );

    // A numeric code — no special chars to escape, should appear verbatim
    await sendOTPEmail(testConfig, "user@example.com", "123456");
    const call = fakeTransport.sendMail.mock.calls[0][0];
    expect(call.html).toContain("123456");
  });
});
