# Agent Guidelines - Implementing EasyAuth

This guide helps AI agents integrate EasyAuth into existing Node.js/TypeScript projects.

## Quick Start

```bash
# Install core package and an adapter
npm install @easy-auth/core @easy-auth/adapter-sqlite

# For Redis
npm install @easy-auth/adapter-redis

# For MongoDB
npm install @easy-auth/adapter-mongo
```

## Minimal Setup

```typescript
import { createAuth } from "@easy-auth/core";
import { sqliteAdapter } from "@easy-auth/adapter-sqlite";

const auth = createAuth({
  smtp: {
    host: process.env.SMTP_HOST!,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    from: process.env.SMTP_FROM!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!, // Must be 32+ chars
    expiresIn: "7d",
  },
  store: sqliteAdapter("./auth.db"),
});
```

## API Routes

### Send OTP

```typescript
app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    await auth.sendOTP(email);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ code: error.code });
  }
});
```

### Verify OTP

```typescript
app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  try {
    const result = await auth.verifyOTP(email, code);
    res.json(result); // { token, user, isNewUser }
  } catch (error) {
    res.status(401).json({ code: error.code });
  }
});
```

### Get Current User

```typescript
app.get("/api/auth/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const user = await auth.verifyToken(token!);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ code: error.code });
  }
});
```

## Environment Variables

```env
JWT_SECRET=your-secret-at-least-32-characters-long
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Your App <noreply@example.com>
```

## Using with Next.js

Create `lib/auth.ts`:

```typescript
import { createAuth } from "@easy-auth/core";
import { sqliteAdapter } from "@easy-auth/adapter-sqlite";

export const auth = createAuth({
  smtp: {
    /* ... */
  },
  jwt: { secret: process.env.JWT_SECRET!, expiresIn: "7d" },
  store: sqliteAdapter("./auth.db"),
});
```

Then use in API routes:

```typescript
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const { email } = await req.json();
  await auth.sendOTP(email);
  return Response.json({ ok: true });
}
```

## Using with Resend (Email)

```typescript
import { createAuth } from "@easy-auth/core";

const auth = createAuth({
  smtp: {
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
    from: "Your App <onboarding@resend.dev>",
  },
  jwt: { secret: process.env.JWT_SECRET!, expiresIn: "7d" },
  store: sqliteAdapter("./auth.db"),
});
```

## Two-Factor Authentication (2FA)

### Enable 2FA for a user

```typescript
const { secret, qrDataUrl, backupCodes } = await auth.enroll2FA(email);
// Show qrDataUrl to user (use QR code library)
// Store backupCodes securely, show to user once
```

### Confirm 2FA

```typescript
await auth.confirm2FA(email, totpCode);
```

### Verify 2FA during login

```typescript
const { token, user } = await auth.verifyOTP(email, otpCode);
if (user.totpEnabled) {
  await auth.verify2FA(email, totpCodeFromAuthenticator);
}
```

## Storage Adapters

| Database | Package                     | Setup                                    |
| -------- | --------------------------- | ---------------------------------------- |
| SQLite   | `@easy-auth/adapter-sqlite` | `sqliteAdapter('./auth.db')`             |
| Redis    | `@easy-auth/adapter-redis`  | `redisAdapter({ url: 'redis://...' })`   |
| MongoDB  | `@easy-auth/adapter-mongo`  | `mongoAdapter({ uri: 'mongodb://...' })` |

## React Integration

```typescript
import { AuthModal } from '@easy-auth/react';
import { useState } from 'react';

function App() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <button onClick={() => setShowAuth(true)}>Sign In</button>
      {showAuth && (
        <AuthModal
          apiBaseUrl="/api/auth"
          onSuccess={({ token, user }) => {
            localStorage.setItem('token', token);
            setShowAuth(false);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
```

## Error Handling

```typescript
try {
  await auth.verifyOTP(email, code);
} catch (error) {
  switch (error.code) {
    case "OTP_INVALID":
      // Wrong code
      break;
    case "OTP_EXPIRED":
      // Code expired, user needs new one
      break;
    case "ACCOUNT_LOCKED":
      // Too many attempts
      break;
  }
}
```

## Error Codes

| Code               | HTTP | Meaning                 |
| ------------------ | ---- | ----------------------- |
| `INVALID_EMAIL`    | 400  | Invalid email format    |
| `OTP_INVALID`      | 401  | Wrong OTP code          |
| `OTP_EXPIRED`      | 401  | OTP has expired         |
| `OTP_MAX_ATTEMPTS` | 429  | Too many wrong attempts |
| `ACCOUNT_LOCKED`   | 429  | Account in lockout      |
| `TOKEN_INVALID`    | 401  | Invalid JWT             |
| `TOKEN_EXPIRED`    | 401  | JWT expired             |
| `2FA_INVALID`      | 401  | Wrong TOTP code         |

## Configuration Options

```typescript
const auth = createAuth({
  smtp: {
    /* required */
  },
  jwt: { secret: "...", expiresIn: "7d" },
  store: adapter,
  otp: {
    length: 6, // OTP digits
    ttlSeconds: 600, // 10 minutes
    maxAttempts: 5, // Max wrong attempts
    lockoutSeconds: 900, // 15 min lockout
  },
  email: {
    subject: "Your sign-in code",
    templateFn: (code) => ({
      text: `Your code is: ${code}`,
      html: `<p>Your code is: <strong>${code}</strong></p>`,
    }),
  },
});
```

## Security Notes

- JWT secrets must be 32+ characters
- OTPs are bcrypt-hashed (never stored in plaintext)
- TOTP secrets are AES-256-GCM encrypted
- All comparisons are timing-safe
- Never log OTP codes or secrets
