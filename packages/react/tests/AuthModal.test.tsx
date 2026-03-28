import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthModal } from "../src/AuthModal.js";

const API_BASE = "/api/auth";

const defaultProps = {
  apiBaseUrl: API_BASE,
  onSuccess: vi.fn(),
  onClose: vi.fn(),
};

const mockUser = {
  email: "user@example.com",
  createdAt: Date.now(),
  lastLoginAt: Date.now(),
  totpEnabled: false,
  metadata: {},
};

function mockFetch(overrides: Record<string, unknown> = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = input.toString();
    if (url.endsWith("/send-otp")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (url.endsWith("/verify-otp")) {
      return new Response(
        JSON.stringify({ token: "jwt-token", user: mockUser, isNewUser: false, ...overrides }),
        { status: 200 }
      );
    }
    if (url.endsWith("/verify-2fa")) {
      return new Response(
        JSON.stringify({ token: "jwt-token-2fa", user: mockUser }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 });
  });
}

describe("AuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the email input step initially", () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send code/i })).toBeInTheDocument();
  });

  it("submits email and transitions to OTP step", async () => {
    const user = userEvent.setup();
    mockFetch();
    render(<AuthModal {...defaultProps} />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Digit 1 of 6")).toBeInTheDocument();
  });

  it("submits OTP and calls onSuccess with token and user", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockFetch();
    render(<AuthModal {...defaultProps} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    // Type digits one at a time
    for (let i = 0; i < 6; i++) {
      await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), String(i + 1));
    }
    await user.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("jwt-token", mockUser, false);
    });
  });

  it("displays error message on 401 response", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = input.toString();
      if (url.endsWith("/send-otp")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "OTP_INVALID" }), { status: 401 });
    });

    render(<AuthModal {...defaultProps} />);
    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    for (let i = 0; i < 6; i++) {
      await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), "0");
    }
    await user.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert").textContent).toContain("Incorrect code");
    });
  });

  it("transitions to 2FA step when backend returns totpEnabled: true", async () => {
    const user = userEvent.setup();
    mockFetch({ user: { ...mockUser, totpEnabled: true } });
    render(<AuthModal {...defaultProps} />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    for (let i = 0; i < 6; i++) {
      await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), String(i + 1));
    }
    await user.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
    });
  });

  it("paste event on OTP input populates all digits", async () => {
    const user = userEvent.setup();
    mockFetch();
    render(<AuthModal {...defaultProps} />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    const firstInput = screen.getByLabelText("Digit 1 of 6");
    firstInput.focus();
    await fireEvent.paste(firstInput, {
      clipboardData: { getData: () => "654321" },
    });

    await waitFor(() => {
      expect((screen.getByLabelText("Digit 1 of 6") as HTMLInputElement).value).toBe("6");
      expect((screen.getByLabelText("Digit 2 of 6") as HTMLInputElement).value).toBe("5");
      expect((screen.getByLabelText("Digit 6 of 6") as HTMLInputElement).value).toBe("1");
    });
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AuthModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AuthModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AuthModal {...defaultProps} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("handles backspace moving focus to previous digit", async () => {
    const user = userEvent.setup();
    mockFetch();
    render(<AuthModal {...defaultProps} />);
    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    const d1 = screen.getByLabelText("Digit 1 of 6");
    const d2 = screen.getByLabelText("Digit 2 of 6");
    
    await user.type(d1, "1");
    await user.type(d2, "2");
    
    expect(d2).toHaveValue("2");
    
    // Press backspace on d2
    d2.focus();
    await user.keyboard("{Backspace}");
    expect(d2).toHaveValue("");
    
    // Press backspace again on empty d2 -> should move focus to d1
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(d1);
  });

  it("goes back to email step when Back button is clicked", async () => {
    const user = userEvent.setup();
    mockFetch();
    render(<AuthModal {...defaultProps} />);
    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("handles 2FA verification error", async () => {
    const user = userEvent.setup();
    
    // Setup fetch to fail on /verify-2fa
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = input.toString();
      if (url.endsWith("/send-otp")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.endsWith("/verify-otp")) {
        return new Response(
          JSON.stringify({ token: "jwt-token", user: { ...mockUser, totpEnabled: true }, isNewUser: false }),
          { status: 200 }
        );
      }
      if (url.endsWith("/verify-2fa")) {
        return new Response(JSON.stringify({ error: "2FA_INVALID" }), { status: 401 });
      }
      return new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 });
    });

    render(<AuthModal {...defaultProps} />);
    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => screen.getByLabelText("Digit 1 of 6"));

    // Enter OTP
    for (let i = 0; i < 6; i++) await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), "1");
    await user.click(screen.getByRole("button", { name: /verify code/i }));

    // Now in 2FA step
    await waitFor(() => screen.getByText(/two-factor authentication/i));
    for (let i = 0; i < 6; i++) await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), "2");
    
    await user.click(screen.getByRole("button", { name: /Verify/i })); // Note verify button for 2FA is Verify

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid authenticator code");
    });
  });

  it("handles non-JSON / generic errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("internal server error", { status: 500 }); // not json
    });

    render(<AuthModal {...defaultProps} />);
    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));

    // Reacting to a thrown error when res.json() fails
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Something went wrong");
    });
  });
});
