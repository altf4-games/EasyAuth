<div align="center">
  <h1>EasyAuth 🛡️</h1>
  <p>A modern, framework-agnostic OTP and 2FA authentication engine for Node.js, Next.js, and Flutter.</p>
</div>

---

## 📖 Overview

EasyAuth provides a completely modular approach to passwordless authentication. Instead of a monolithic library, it is composed of independent engine, adapter, and frontend packages. This architecture ensures you only bundle exactly what you need, keeping your final application footprint as light as possible.

Features include:
- **Email OTPs**: Secure, cryptographically generated 6-digit pins.
- **TOTP 2FA**: RFC-6238 compliant Authenticator App support (Google Authenticator, Authy).
- **Session Management**: Lightweight, stateless JWT session lifecycles.
- **Brute Force Protection**: Native exponential backoffs and temporary account locking mapped implicitly to your storage layer.

## 📦 Packages

This repository is managed as a `pnpm` workspace containing the following independent packages:

| Package | Description |
|---|---|
| [`@easy-auth/core`](./packages/core) | The backend engine handling cryptography, token generation, and SMTP dispatchting. |
| [`@easy-auth/adapter-sqlite`](./packages/adapter-sqlite) | Official SQLite storage adapter using `better-sqlite3`. |
| [`@easy-auth/adapter-redis`](./packages/adapter-redis) | Official Redis storage adapter for distributed edge scaling. |
| [`@easy-auth/adapter-mongo`](./packages/adapter-mongo) | Official MongoDB adapter with TTL index support. |
| [`@easy-auth/react`](./packages/react) | Accessible drop-in `<AuthModal />` UI component with zero-gradient modern Tailwind styling. |
| [`easy_auth_flutter`](./packages/easy_auth_flutter) | Native mobile Dart/Flutter authentication widget with secure device Keystore/Keychain persistence. |

## 🚀 Examples & Quick Start

Want to see how it all fits together? We've provided production-ready reference implementations. You can download these straight to your machine using `degit` without needing to clone the entire repository.

### Next.js 14 Frontend
A full-stack App Router implementation utilizing the React modal and server actions.
```bash
npx degit altf4-games/EasyAuth/examples/nextjs my-next-app
cd my-next-app
pnpm install
pnpm dev
```

### Express + SQLite API
A headless REST API validating sessions, dispatching emails, and storing users in a local SQLite WAL mapping.
```bash
npx degit altf4-games/EasyAuth/examples/express-sqlite my-auth-api
cd my-auth-api
pnpm install
# Configure your .env before running
pnpm dev
```

### Flutter Mobile App
A cross-platform iOS/Android implementation connecting natively to the Express API.
```bash
npx degit altf4-games/EasyAuth/examples/flutter-app my-flutter-app
cd my-flutter-app
flutter pub get
flutter run
```

## 🛠️ Development & Publishing

If you are cloning this repository to contribute or publish:

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/altf4-games/EasyAuth.git
   cd EasyAuth
   pnpm install
   ```

2. Run the test suite:
   ```bash
   pnpm test
   ```

<div align="center">
  Built securely by altf4-games.
</div>