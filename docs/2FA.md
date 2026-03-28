# 2FA.md — TOTP Two-Factor Authentication

## Overview

easy-auth supports TOTP (Time-based One-Time Password) 2FA per RFC 6238.
It works with any TOTP app: Google Authenticator, Authy, 1Password, Bitwarden, etc.

2FA is optional. It is not configured globally — each user enrolls individually.

---

## Enrollment Flow

### 1. Start enrollment

```ts
const { secret, qrDataUrl, backupCodes } = await auth.enroll2FA(email);
```

`qrDataUrl` is an `otpauth://totp/...` URI. Pass it to a QR code library to render it.

```tsx
// React example using qrcode.react
import QRCode from "qrcode.react";
<QRCode value={qrDataUrl} size={200} />
```

The `secret` is the base32-encoded raw secret. Show it as a fallback for users who cannot scan.

`backupCodes` is an array of 8 single-use recovery codes. **Show these once and ask the user to save them.** They are not retrievable after this point.

### 2. Confirm enrollment

After the user scans the QR code and their authenticator app shows a code:

```ts
await auth.confirm2FA(email, totpCodeFromUser);
```

This verifies the code and enables TOTP for that account. It throws `2FA_INVALID` if the code is wrong.

---

## Login Flow (after enrollment)

After `verifyOTP` succeeds, check if the user has 2FA enabled and prompt accordingly:

```ts
const { token, user } = await auth.verifyOTP(email, otpCode);

if (user.totpEnabled) {
  // Collect totpCode from the user, then:
  await auth.verify2FA(email, totpCodeFromUser);
  // Now issue the session token to the client
}
```

---

## Backup Codes

If a user loses their authenticator app:

```ts
// The user enters a backup code in the same TOTP field
await auth.verify2FA(email, backupCode);
```

Backup codes work in the same `verify2FA` call. Each code can only be used once.
After the code is consumed it is deleted from the store. There is no way to recover it.

---

## Re-enrollment

To reset 2FA (e.g., user gets a new phone):

1. Disable the current TOTP via your adapter directly: `await store.setTOTPEnabled(email, false)`.
2. Call `auth.enroll2FA(email)` again to start fresh.

Alternatively, implement a support flow using admin access to your adapter.

---

## Error Reference

| Code | When |
|---|---|
| `2FA_NOT_ENROLLED` | `confirm2FA` or `verify2FA` called before enrollment |
| `2FA_ALREADY_ENROLLED` | `enroll2FA` called when TOTP is already enabled |
| `2FA_INVALID` | Wrong TOTP code or invalid/used backup code |
