import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createAuth, AuthError } from "@altf4-auth/core";
import { sqliteAdapter } from "@altf4-auth/sqlite";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Require minimal config
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in .env");
  process.exit(1);
}

// Instantiate auth and sqlite adapter
const auth = createAuth({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "user",
      pass: process.env.SMTP_PASS || "pass",
    },
    from: process.env.SMTP_FROM || "Example App <noreply@example.com>",
  },
  // the easy-auth-sqlite adapter stores the DB at this file path
  store: sqliteAdapter("./auth.db"),
});

// Helper to map AuthError codes to HTTP status
function mapErrorToStatus(err) {
  if (err instanceof AuthError) {
    switch (err.code) {
      case "INVALID_EMAIL":
        return 400;
      case "OTP_INVALID":
      case "OTP_EXPIRED":
      case "2FA_INVALID":
      case "TOKEN_INVALID":
      case "TOKEN_EXPIRED":
        return 401;
      case "OTP_MAX_ATTEMPTS":
      case "ACCOUNT_LOCKED":
        return 429;
      default:
        return 500;
    }
  }
  return 500;
}

// ----------------------------------------------------
// Authentication Routes
// ----------------------------------------------------

/**
 * 1. Request an OTP email
 */
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    await auth.sendOTP(email);
    res.json({ ok: true });
  } catch (err) {
    const status = mapErrorToStatus(err);
    res.status(status).json({ error: err.code || "UNKNOWN" });
  }
});

/**
 * 2. Verify the OTP -> receive session Token
 */
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await auth.verifyOTP(email, code);
    // Returns { token, user, isNewUser }
    res.json(result);
  } catch (err) {
    const status = mapErrorToStatus(err);
    res.status(status).json({ error: err.code || "UNKNOWN" });
  }
});

/**
 * (Optional 2FA) 3. Verify TOTP -> receive session Token
 */
app.post("/api/auth/verify-2fa", async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await auth.verify2FA(email, code);
    res.json(result);
  } catch (err) {
    const status = mapErrorToStatus(err);
    res.status(status).json({ error: err.code || "UNKNOWN" });
  }
});

// ----------------------------------------------------
// Protected Application Routes
// ----------------------------------------------------

/**
 * Get current user. Requires `Authorization: Bearer <token>`
 */
app.get("/api/user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    // verifyToken throws if expired, tampered, or invalid.
    const user = await auth.verifyToken(token);
    
    res.json({ user });
  } catch (err) {
    const status = mapErrorToStatus(err);
    res.status(status).json({ error: err.code || "UNAUTHORIZED" });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Example API listening on port ${PORT}`);
});
