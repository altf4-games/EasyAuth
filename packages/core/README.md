# easy-auth

Email OTP authentication with optional TOTP 2FA — drop it into any Node.js backend and have a working auth system in under 2 minutes.

---

## Why this exists

- **Clerk** is expensive at scale and locks you into a third-party service.
- **Passport.js** requires significant setup and strategy wrangling before you get anything working.
- **easy-auth** gives you email OTP login and optional 2FA in a single `createAuth()` call, running entirely on your own infrastructure.

No vendor lock-in. No paid tiers. No separate auth server. Your users' emails never leave your server.

---

## Getting started

```bash
npm install easy-auth easy-auth-sqlite
```

```ts
// lib/auth.ts — create once, import everywhere
import { createAuth } from "@altf4-auth/core";
import { sqliteAdapter } from "@altf4-auth/sqlite";

export const auth = createAuth({
  smtp: {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    auth: { user: "you@example.com", pass: process.env.SMTP_PASS },
    from: "My App <noreply@example.com>",
  },
  jwt: {
    secret: process.env.JWT_SECRET, // min 32 characters
  },
  store: sqliteAdapter("./auth.db"),
});
```

```ts
// Express route handlers
import express from "express";
import { auth } from "./lib/auth.js";
import { AuthError } from "@altf4-auth/core";

const app = express();
app.use(express.json());

// 1. Request an OTP
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    await auth.sendOTP(req.body.email);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.code === "INVALID_EMAIL" ? 400 : 500).json({ error: err.code });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// 2. Verify the OTP and receive a session token
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { token, user, isNewUser } = await auth.verifyOTP(req.body.email, req.body.code);
    res.json({ token, user, isNewUser });
  } catch (err) {
    if (err instanceof AuthError) {
      const status = { OTP_INVALID: 401, OTP_EXPIRED: 401, ACCOUNT_LOCKED: 429, OTP_MAX_ATTEMPTS: 429 }[err.code] ?? 500;
      res.status(status).json({ error: err.code });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// 3. Protected route
app.get("/api/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const user = await auth.verifyToken(token);
    res.json({ user });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});
```

That's it. Copy-paste ready. No extra config needed to get started.

---

## Storage adapters

| Package | Best for | Setup |
|---|---|---|
| `@altf4-auth/sqlite` | Dev, small apps, single-process | `sqliteAdapter("./auth.db")` |
| `@altf4-auth/redis` | Multi-process / multi-server | `redisAdapter({ url: "redis://localhost:6379" })` |
| `@altf4-auth/mongo` | Teams already using MongoDB | `mongoAdapter({ uri: "...", dbName: "@altf4-auth/core" })` |

If you pass no `store`, an in-memory adapter is used automatically. **It logs a warning on startup and loses all state on restart. Do not use it in production.**

See [ADAPTERS.md](../../docs/ADAPTERS.md) for full details.

---

## Frontend

- **React / Next.js** — `npm install easy-auth-react` — drop in `<AuthModal />` and pass your API endpoints as props.
- **Flutter** — `easy_auth_flutter` on pub.dev — use `EasyAuthModal` as a bottom sheet.

---

## 2FA (TOTP)

```ts
// Enrollment — show this QR code or secret to the user
const { secret, qrDataUrl, backupCodes } = await auth.enroll2FA(email);

// Confirmation — after the user scans and enters their first code
await auth.confirm2FA(email, totpCodeFromUser);

// On each subsequent login, after verifyOTP succeeds:
await auth.verify2FA(email, totpCodeFromUser);
```

See [2FA.md](../../docs/2FA.md) for the full flow and backup code usage.

---

## Configuration reference

```ts
interface AuthConfig {
  smtp: {
    host: string;          // SMTP server hostname
    port: number;          // Usually 587 (TLS) or 465 (SSL)
    secure: boolean;       // true for port 465
    auth: {
      user: string;        // SMTP username / email
      pass: string;        // SMTP password or API key
    };
    from: string;          // Display name + address: "App <noreply@app.com>"
  };
  jwt: {
    secret: string;        // Min 32 chars. Use a random value from a secret manager.
    expiresIn?: string;    // Default "7d". Accepts ms/zeit-style notation.
  };
  otp?: {
    length?: number;       // Default 6
    ttlSeconds?: number;   // Default 600 (10 minutes)
    maxAttempts?: number;  // Default 5
    lockoutSeconds?: number; // Default 900 (15 minutes)
  };
  store?: StorageAdapter;  // Default: in-memory (dev only)
  email?: {
    subject?: string;      // Default "Your login code"
    templateFn?: (code: string) => { text: string; html: string };
  };
}
```

---

## Error handling

All errors thrown by easy-auth are `AuthError` instances with a `code` field:

| Code | HTTP status | Meaning |
|---|---|---|
| `INVALID_EMAIL` | 400 | Email format rejected before any store access |
| `OTP_EXPIRED` | 401 | No valid OTP found or it has expired |
| `OTP_INVALID` | 401 | Wrong code entered |
| `OTP_MAX_ATTEMPTS` | 429 | Too many wrong attempts — account locked |
| `ACCOUNT_LOCKED` | 429 | Lockout active from a previous flood of attempts |
| `TOKEN_INVALID` | 401 | JWT is malformed, tampered, or signed with a different secret |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `2FA_NOT_ENROLLED` | 400 | TOTP called but user has not enrolled |
| `2FA_INVALID` | 401 | Wrong TOTP code or backup code |
| `2FA_ALREADY_ENROLLED` | 400 | enroll2FA called when TOTP is already active |
| `CONFIG_INVALID` | — | Thrown synchronously at createAuth() time if config is wrong |

---

## Security model

**What easy-auth does:**

- OTPs are generated with `crypto.randomInt` and hashed with bcrypt (cost 10) before storage
- OTP comparison uses bcrypt.compare — timing-safe by design
- JWTs are HS256 signed with a minimum 32-char secret, include a `jti` per token
- TOTP secrets are encrypted at rest with AES-256-GCM, key derived via HKDF from your JWT secret
- Backup codes are bcrypt-hashed and single-use
- Failed OTP attempts are counted and result in a configurable lockout
- OTPs are deleted from the store immediately after a successful verify

**What easy-auth does NOT do (your app's responsibility):**

- HTTP-level rate limiting — use [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit), or your CDN/proxy
- HTTPS — always terminate TLS before your Node.js process
- CAPTCHA integration
- IP blocking

---

## Self-hosting

easy-auth runs entirely on your own infrastructure. No telemetry, no callbacks to third-party services. The only external network calls are the SMTP emails you configure and any connections to your chosen database adapter.

---

## Roadmap

Future versions may add: OAuth / social login, SMS OTP (Twilio / Vonage), per-token revocation via a denylist.

---

## License

MIT
