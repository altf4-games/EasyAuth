# INSTRUCTIONS.md — easy-auth npm package

## What you are building

An npm package called `easy-auth` that provides email OTP-based authentication with optional TOTP 2FA. The developer drops it into any Node.js backend and gets a fully working auth system in under 2 minutes. No vendor lock-in. No paid tiers. No separate auth server.

The package handles:
- Sending OTP codes via SMTP (any provider: Gmail, Resend, Postmark, SendGrid)
- Storing OTP state in a pluggable adapter (SQLite by default, Redis or MongoDB for scale)
- Creating a user record on first login (email is the primary key, no synthetic IDs)
- Issuing and verifying signed JWT sessions
- Optional TOTP 2FA with QR code enrollment (RFC 6238 compliant)
- A ready-to-drop-in React/Next.js UI component
- A ready-to-drop-in Flutter widget

This is a backend npm package with companion frontend packages. The backend is framework-agnostic (works with Express, Fastify, Next.js API routes, etc.).

---

## Monorepo structure

```
easy-auth/
  packages/
    core/                  # The main npm package: easy-auth
    adapter-sqlite/        # Default storage adapter
    adapter-redis/         # Redis adapter
    adapter-mongo/         # MongoDB adapter
    react/                 # React/Next.js UI component: easy-auth-react
    flutter/               # Flutter widget: easy_auth_flutter
  examples/
    express-sqlite/        # Minimal Express + SQLite example
    nextjs/                # Next.js App Router example (API routes + React component)
    flutter-app/           # Flutter app consuming the API
  docs/
    SECURITY.md
    ADAPTERS.md
    2FA.md
```

Use a monorepo managed with `pnpm workspaces`. Each package has its own `package.json` and is published independently to npm. The core package is `easy-auth`. Adapters are `easy-auth-sqlite`, `easy-auth-redis`, `easy-auth-mongo`. The React package is `easy-auth-react`.

---

## Package: core (`easy-auth`)

### Runtime requirements

- Node.js >= 18
- TypeScript (compile to CJS + ESM dual output)
- Zero mandatory peer dependencies beyond nodemailer and jsonwebtoken
- Adapters are optional peer dependencies

### Public API surface

The entire API a developer ever calls is:

```typescript
import { createAuth } from "easy-auth";

const auth = createAuth(config);

// Send OTP to an email address
await auth.sendOTP(email);

// Verify the OTP and return a session token + user object
const result = await auth.verifyOTP(email, code);
// result: { token: string, user: User, isNewUser: boolean }

// Verify a session token (call this on every protected request)
const user = await auth.verifyToken(token);
// throws AuthError if invalid or expired

// 2FA enrollment (optional flow)
const { secret, qrDataUrl, backupCodes } = await auth.enroll2FA(email);
await auth.confirm2FA(email, totpCode);  // call once to verify enrollment
await auth.verify2FA(email, totpCode);  // call on each login after OTP step

// Revoke all sessions for a user
await auth.revokeUser(email);
```

Nothing else is on the public API. Do not expose internal methods. Do not expose the adapter directly.

### Config schema

```typescript
interface AuthConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
    from: string;         // "My App <noreply@myapp.com>"
  };
  jwt: {
    secret: string;       // min 32 chars, enforced at runtime
    expiresIn?: string;   // default "7d"
  };
  otp?: {
    length?: number;      // default 6
    ttlSeconds?: number;  // default 600 (10 minutes)
    maxAttempts?: number; // default 5, then lock for lockoutSeconds
    lockoutSeconds?: number; // default 900 (15 minutes)
  };
  store?: StorageAdapter; // default: in-memory (dev only, warns on startup)
  email?: {
    subject?: string;     // default "Your login code"
    templateFn?: (code: string) => { text: string; html: string };
  };
}
```

### Storage adapter interface

Every adapter must implement this interface exactly. No more, no less.

```typescript
interface StorageAdapter {
  // User operations
  getUser(email: string): Promise<User | null>;
  upsertUser(email: string, metadata?: Record<string, unknown>): Promise<User>;

  // OTP operations — adapter is responsible for TTL enforcement
  setOTP(email: string, hashedCode: string, ttlSeconds: number): Promise<void>;
  getOTP(email: string): Promise<{ hashedCode: string; attempts: number } | null>;
  incrementOTPAttempts(email: string): Promise<number>;
  deleteOTP(email: string): Promise<void>;

  // Lockout
  setLockout(email: string, untilTimestamp: number): Promise<void>;
  getLockout(email: string): Promise<number | null>; // returns timestamp or null

  // 2FA
  setTOTPSecret(email: string, encryptedSecret: string): Promise<void>;
  getTOTPSecret(email: string): Promise<string | null>;
  setTOTPEnabled(email: string, enabled: boolean): Promise<void>;
  getTOTPEnabled(email: string): Promise<boolean>;
  setBackupCodes(email: string, hashedCodes: string[]): Promise<void>;
  consumeBackupCode(email: string, hashedCode: string): Promise<boolean>;
}

interface User {
  email: string;
  createdAt: number;     // unix ms
  lastLoginAt: number;   // unix ms
  totpEnabled: boolean;
  metadata: Record<string, unknown>;
}
```

### Security requirements — non-negotiable

These are not optional. Every item here must be implemented before the package is considered functional.

**OTP handling:**
- Generate OTP with `crypto.randomInt` (not Math.random, never)
- Hash the OTP with bcrypt (cost 10) before storing it in the adapter
- Compare using bcrypt.compare, never string equality
- Delete the OTP from the store immediately after a successful verify (single use)
- Enforce attempt limits before comparing. If attempts >= maxAttempts, reject without comparing and set lockout
- All OTP operations must be constant-time where feasible to prevent timing attacks

**Lockout:**
- After maxAttempts failed OTP attempts, lock the email for lockoutSeconds
- Check lockout before doing anything else in verifyOTP
- Return a generic error message. Do not tell the caller whether the email exists

**JWT:**
- Enforce minimum secret length of 32 characters at createAuth time, throw synchronously if not met
- Sign with HS256
- Include: `{ sub: email, iat, exp, jti }` — jti is a random UUID per token
- verifyToken must throw, not return null, on invalid tokens. The caller should catch

**TOTP secret:**
- Encrypt the TOTP secret at rest using AES-256-GCM before passing it to the adapter
- The encryption key comes from `jwt.secret` (derive with HKDF, do not use directly)
- Backup codes: generate 8 codes of 8 random alphanumeric characters, hash each with bcrypt before storing

**General:**
- Never log OTP codes, JWT secrets, or TOTP secrets anywhere — not even in debug logs
- Validate the email format before doing anything (use a simple RFC-compliant regex, not a heavy library)
- All public methods must return typed errors, not generic Error. Define an AuthError class with a `code` field

```typescript
class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

type AuthErrorCode =
  | "INVALID_EMAIL"
  | "OTP_EXPIRED"
  | "OTP_INVALID"
  | "OTP_MAX_ATTEMPTS"
  | "ACCOUNT_LOCKED"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "2FA_NOT_ENROLLED"
  | "2FA_INVALID"
  | "2FA_ALREADY_ENROLLED"
  | "CONFIG_INVALID";
```

### Rate limiting

The package itself does not enforce HTTP-level rate limiting — that is the application's responsibility. Document this clearly in the README. The package enforces OTP attempt limits at the application layer (not HTTP). Provide a note in the README pointing to express-rate-limit, @fastify/rate-limit, etc.

### Email template

The default template must be plain and professional. No marketing language. No images. The default text template:

```
Your login code is: 123456

This code expires in 10 minutes. Do not share it with anyone.

If you did not request this code, ignore this email.
```

The developer can pass `email.templateFn` to fully replace it. Accept a function that returns `{ text, html }`. Never build HTML with string concatenation — use a simple interpolation pattern and document the escaping requirement.

---

## Package: adapter-sqlite (`easy-auth-sqlite`)

- Uses `better-sqlite3` (synchronous, no connection management, single-file database)
- Creates the schema on first run, runs migrations idempotently using a `schema_version` table
- The database file path is passed as a string: `sqliteAdapter("./auth.db")`
- WAL mode enabled by default for better concurrent read performance
- OTP TTL is enforced by storing an `expires_at` timestamp and checking it on read

Schema:

```sql
CREATE TABLE IF NOT EXISTS users (
  email         TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL,
  totp_enabled  INTEGER NOT NULL DEFAULT 0,
  metadata      TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS otp_state (
  email        TEXT PRIMARY KEY,
  hashed_code  TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  expires_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lockouts (
  email      TEXT PRIMARY KEY,
  locked_until INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS totp_secrets (
  email            TEXT PRIMARY KEY,
  encrypted_secret TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_codes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL,
  hashed_code  TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);
```

---

## Package: adapter-redis (`easy-auth-redis`)

- Uses `ioredis`
- Constructor: `redisAdapter({ url: "redis://localhost:6379" })` or accepts an existing ioredis client
- OTP TTL is handled with Redis `EXPIRE` — do not store a timestamp, use native TTL
- All keys are namespaced: `easy-auth:otp:{email}`, `easy-auth:user:{email}`, etc.
- User records are stored as JSON strings
- Lockout is stored as a key that expires at the lockout timestamp (TTL = lockoutSeconds)
- TOTP secrets stored as a separate key with no expiry
- Backup codes stored as a Redis set, members are hashed codes

---

## Package: adapter-mongo (`easy-auth-mongo`)

- Uses the official `mongodb` driver (not mongoose — keep dependencies minimal)
- Constructor: `mongoAdapter({ uri: "mongodb://...", dbName: "easy-auth" })`
- Collections: `users`, `otp_state`, `lockouts`, `totp_secrets`, `backup_codes`
- OTP TTL handled via MongoDB TTL index on `expiresAt` field
- Create all indexes on first connect, idempotently

---

## Package: react (`easy-auth-react`)

### What it is

A single React component `<AuthModal />` that handles the entire email OTP flow, including the optional 2FA step. It is unstyled by default (ships with CSS Modules and a minimal base style), and can be fully overridden by the developer.

### Installation

```
npm install easy-auth-react
```

The React package calls your backend's API endpoints. It does not import from `easy-auth` core directly. The developer passes endpoint URLs as props.

### Component API

```tsx
<AuthModal
  apiBaseUrl="/api/auth"         // required: base URL of your auth endpoints
  onSuccess={(token, user, isNewUser) => void}  // required
  onClose={() => void}           // required
  className?: string             // appended to the root element
  labels?: Partial<AuthLabels>   // override any text string
  theme?: "light" | "dark" | "auto"  // default "auto"
/>
```

### Flow the component handles

1. Email input screen — validates format client-side before sending
2. OTP input screen — 6-digit input with auto-focus, backspace-to-previous, paste support
3. (If 2FA enrolled) TOTP input screen — same input pattern, different label
4. Success — calls onSuccess with the token
5. Error states — displays error codes as human-readable messages, supports retry

### Endpoints the component calls

The component expects these endpoints on `apiBaseUrl`:

```
POST /send-otp      body: { email }           response: { ok: true }
POST /verify-otp    body: { email, code }      response: { token, user, isNewUser }
POST /verify-2fa    body: { email, code }      response: { token, user }
```

The developer implements these endpoints using the `easy-auth` core package. Document this clearly with a full example for both Express and Next.js App Router.

### Accessibility requirements

- All inputs must have visible labels and aria-label attributes
- Focus must be managed correctly between steps (auto-focus first input on step change)
- Error messages must use `role="alert"`
- The modal must trap focus when open
- All interactive elements must be keyboard navigable
- No color as the sole conveyor of meaning

---

## Package: flutter (`easy_auth_flutter`)

### What it is

A Flutter widget `EasyAuthModal` that mirrors the React component. Calls the same backend API endpoints. Published to pub.dev.

### Widget API

```dart
EasyAuthModal(
  apiBaseUrl: 'https://api.myapp.com/auth',
  onSuccess: (String token, Map<String, dynamic> user, bool isNewUser) { },
  onClose: () { },
  theme: EasyAuthTheme.system,   // .light, .dark, .system
  labels: EasyAuthLabels(),      // optional overrides
)
```

### Implementation requirements

- Pure Dart/Flutter, no native code, no platform channels
- HTTP calls via the `http` package (do not use dio — keep dependencies minimal)
- State managed internally using StatefulWidget — do not require the developer to add a state management package
- Supports Android, iOS, Web
- All text is localizable via the `labels` parameter
- Matches Material Design 3 by default, but all colors and text styles are overridable
- No hardcoded colors anywhere in the widget tree — use Theme.of(context)

---

## Examples

### Example 1: Express + SQLite (`examples/express-sqlite`)

This must be a complete, runnable example. Not pseudocode.

File structure:
```
examples/express-sqlite/
  index.js
  .env.example
  package.json
  README.md
```

`index.js` must demonstrate:
- createAuth with sqliteAdapter
- POST /api/auth/send-otp
- POST /api/auth/verify-otp
- A protected route that calls auth.verifyToken from the Authorization header
- Basic error handling that returns proper HTTP status codes

Map AuthError codes to HTTP statuses:
- INVALID_EMAIL -> 400
- OTP_INVALID, OTP_EXPIRED, 2FA_INVALID -> 401
- OTP_MAX_ATTEMPTS, ACCOUNT_LOCKED -> 429
- TOKEN_INVALID, TOKEN_EXPIRED -> 401
- All others -> 500

### Example 2: Next.js (`examples/nextjs`)

Complete Next.js 14 App Router example.

File structure:
```
examples/nextjs/
  app/
    api/
      auth/
        send-otp/route.ts
        verify-otp/route.ts
        verify-2fa/route.ts
    page.tsx               // uses <AuthModal /> from easy-auth-react
    dashboard/
      page.tsx             // protected page, reads token from cookie
  lib/
    auth.ts                // creates and exports the auth instance (singleton)
  middleware.ts            // uses auth.verifyToken to protect /dashboard/*
  .env.example
  package.json
  README.md
```

The Next.js example must show:
- How to create the auth singleton in `lib/auth.ts` and import it in route handlers
- Token stored in an httpOnly cookie after verify-otp (not localStorage)
- Middleware.ts reading the cookie and calling auth.verifyToken, redirecting to / on failure
- The `<AuthModal />` component on the home page, setting the cookie on onSuccess
- The 2FA enrollment flow (a settings page that calls enroll2FA and displays the QR code)

### Example 3: Flutter (`examples/flutter-app`)

Complete Flutter app.

```
examples/flutter-app/
  lib/
    main.dart
    screens/
      home_screen.dart    // shows EasyAuthModal, stores token in flutter_secure_storage
      dashboard_screen.dart  // protected screen, passes token in Authorization header
  pubspec.yaml
  README.md
```

The Flutter example must show:
- EasyAuthModal displayed as a bottom sheet
- Token stored using flutter_secure_storage
- A simple protected API call passing the token as Bearer in Authorization header
- Navigation from home to dashboard after successful auth

---

## Tests

### Coverage requirements

Every file in `packages/core/src` must have a corresponding test file. Aim for 90% line coverage. Use Vitest.

### What to test in core

**sendOTP:**
- Sends an email when given a valid address
- Rejects an invalid email format with INVALID_EMAIL
- Does not reveal whether the email exists in the store (same response for new and existing)
- Generates a 6-digit code by default, respects otp.length config
- Hashes the code before storing (stored value !== plaintext code)
- Replaces a pending OTP if called again before expiry (idempotent resend)

**verifyOTP:**
- Returns { token, user, isNewUser: true } for a first-time email
- Returns { token, user, isNewUser: false } for a returning email
- Rejects with OTP_INVALID for wrong code
- Rejects with OTP_EXPIRED for an expired code
- Rejects with ACCOUNT_LOCKED when lockout is active
- Increments attempt count on each failure
- Sets lockout after maxAttempts failures
- Deletes the OTP from store on success (cannot reuse)
- Updates lastLoginAt on success

**verifyToken:**
- Returns the User for a valid token
- Throws TOKEN_EXPIRED for an expired token
- Throws TOKEN_INVALID for a tampered token
- Throws TOKEN_INVALID for a token signed with a different secret

**2FA:**
- enroll2FA returns a secret, a data URL for the QR code, and 8 backup codes
- Throws 2FA_ALREADY_ENROLLED if called when TOTP is already enabled
- confirm2FA enables TOTP only when the provided code is correct
- verify2FA returns true for a valid TOTP code
- verify2FA rejects invalid codes
- consumeBackupCode works once per code, fails on reuse

**Config validation:**
- createAuth throws CONFIG_INVALID synchronously if jwt.secret is under 32 chars
- createAuth throws CONFIG_INVALID if smtp config is missing required fields

### Adapter tests

Each adapter package must have integration tests using the adapter against a real instance (SQLite: temp file, Redis: use ioredis-mock, Mongo: use mongodb-memory-server).

Test the full StorageAdapter interface for each adapter:
- upsertUser creates user on first call, updates lastLoginAt on subsequent calls
- setOTP / getOTP / deleteOTP round-trip
- getOTP returns null for expired OTPs (TTL enforcement)
- incrementOTPAttempts increments correctly
- setLockout / getLockout round-trip
- getLockout returns null after expiry
- TOTP methods round-trip
- consumeBackupCode marks code used and rejects reuse

### React component tests

Use Vitest + Testing Library. Mock fetch.

- Renders the email input step initially
- Submits email and transitions to OTP step
- Submits OTP and calls onSuccess with token and user
- Displays error message on 401 response
- Transitions to 2FA step when backend returns a 2FA_REQUIRED indicator
- Paste event on OTP input populates all digits

### Test utilities

Provide a `createTestAuth()` helper in a `test-utils` package that creates an auth instance with the in-memory adapter, a fake SMTP transport (nodemailer's `createTransport({ jsonTransport: true })`), and a deterministic JWT secret. This helper is used in all core tests.

---

## Code style requirements

These apply to every file in every package, without exception.

- TypeScript strict mode in every package (`"strict": true` in tsconfig)
- No `any` types. If a type is genuinely unknown, use `unknown` and narrow it
- No `@ts-ignore` or `@ts-expect-error` except in test files where unavoidable, and each must have an explanatory comment on the same line
- No emojis anywhere: not in code, not in comments, not in console output, not in log messages, not in error messages
- Code comments only where the why is not obvious from reading the code. Do not comment what the code does, comment why it does it that way. Do not leave TODO comments in committed code
- No console.log in library code. Use a structured logger interface that defaults to a no-op, so developers can inject their own logger if they want
- All exported functions and classes must have JSDoc with @param, @returns, and @throws where applicable
- Consistent naming: camelCase for variables and functions, PascalCase for types and classes, SCREAMING_SNAKE_CASE for module-level constants
- No magic numbers. Every constant (OTP length, TTL, max attempts, etc.) must be a named constant with a JSDoc comment explaining the choice

---

## README requirements (`packages/core/README.md`)

The README is the package's primary sales surface and its primary documentation. It must be written for a developer who has never heard of this package and is looking for a quick auth solution.

Structure:

1. One-line description
2. Why this exists (Clerk is expensive at scale, Passport.js requires significant setup, this takes 2 minutes)
3. Getting started — the complete minimal setup from `npm install` to a working /send-otp and /verify-otp route. This section must work if copy-pasted verbatim
4. Storage adapters — what each one is for, when to use it, one-liner setup for each
5. Frontend — link to easy-auth-react and easy_auth_flutter with a one-liner each
6. 2FA — how to enable the enrollment flow
7. Configuration reference — full config schema with descriptions and defaults
8. Error handling — list of AuthError codes and what they mean
9. Security model — what the package does (OTP hashing, JWT signing, lockout, TOTP encryption) and what it does not do (HTTP rate limiting, HTTPS — those are the app's job)
10. Self-hosting note — this package runs entirely on your infrastructure, no data leaves your server
11. License

The getting started section must be under 40 lines of code. If it is longer, simplify the API.

---

## What to explicitly not build

Do not build:
- OAuth / social login (out of scope for v1, mention it as a future roadmap item)
- SMS OTP (SMTP only for v1)
- A dashboard or admin UI
- Session revocation by token ID (revokeUser revokes all sessions for a user by invalidating via a generation counter in the user record — document this pattern)
- IP-based rate limiting (document that this is the app's responsibility)
- Captcha integration
- Multi-tenancy

---

## Definition of done

The package is considered complete when:

- `npm install easy-auth` and following the README getting started section produces a working auth endpoint in under 2 minutes on a fresh Node.js project
- All tests pass with 90% line coverage
- The Express example runs with `node index.js` after `npm install` and `.env` setup
- The Next.js example runs with `npm run dev` after setup
- The Flutter example runs on iOS simulator and Android emulator
- TypeScript consumers get full type inference with no `any` leaking from public API types
- The package passes `npm audit` with no high or critical vulnerabilities
- `npm publish --dry-run` from each package directory completes without errors