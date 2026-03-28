# SECURITY.md

## Security Model

### OTP Security

- OTPs are generated using `crypto.randomInt` — a cryptographically secure PRNG. `Math.random` is never used.
- The plaintext OTP is hashed with bcrypt (cost factor 10) before being stored in the adapter. The plaintext is never persisted.
- Comparison uses `bcrypt.compare`, which is timing-safe. String equality is never used.
- OTPs are deleted from the store immediately after a successful verify. They are single-use.
- If a user requests a new OTP while one is pending, the existing OTP is replaced (idempotent resend).

### Brute Force Protection

- Failed OTP attempts are counted per email in the store.
- After `maxAttempts` failures (default: 5), the account is locked for `lockoutSeconds` (default: 900 = 15 minutes).
- The lockout is checked before any OTP comparison, so even with a valid code the check is rejected during lockout.
- Error messages are generic and do not reveal whether an email address exists in the store.

### JWT Security

- Tokens are HS256 signed. The signing secret must be at least 32 characters — enforced synchronously at `createAuth()` time.
- Each token includes a unique `jti` (JWT ID) UUID, enabling future per-token revocation patterns.
- `verifyToken` throws `AuthError` on invalid or expired tokens; it never returns `null`.
- `revokeUser` invalidates all active sessions for a user by purging their active OTP state. Full per-token revocation via a denylist is not implemented in v1 (documented as a roadmap item).

### TOTP / 2FA Security

- TOTP secrets are generated as 20 random bytes encoded as base32 (160-bit entropy).
- Before storage, secrets are encrypted with AES-256-GCM. The encryption key is derived from `jwt.secret` via HKDF-SHA-256 with a fixed info string, providing key separation between signing and encryption.
- Backup codes are 8 randomly generated alphanumeric characters (64-bit entropy each). They are bcrypt-hashed before storage and are single-use.
- TOTP verification checks the current time window plus one step in each direction (±30 s) to handle client clock skew.
- TOTP code comparison uses `crypto.timingSafeEqual` to prevent timing attacks.

### What this package does NOT handle

| Concern | Your responsibility |
|---|---|
| HTTP-level rate limiting | Use express-rate-limit, @fastify/rate-limit, or your CDN |
| HTTPS / TLS termination | Configure your server or reverse proxy |
| CAPTCHA / bot detection | Add Cloudflare Turnstile or hCaptcha at your API gateway |
| IP blocking | Handle at your load balancer or CDN |
| Multi-tenancy | Out of scope for v1 |

### Logging Policy

easy-auth never logs OTP codes, JWT secrets, or TOTP secrets. The built-in logger is a no-op. If you inject a custom logger, ensure it does not log the `req.body` of auth endpoints.

### Reporting Vulnerabilities

Open a private security advisory on GitHub. Do not open a public issue for security reports.
