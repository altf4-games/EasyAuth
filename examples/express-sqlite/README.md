# Express + SQLite EasyAuth Example

This is a minimal example showing how to integrate `@altf4-auth/core` with Express and the SQLite storage adapter.

## Getting Started

1. Set up your environment variables:
   ```sh
   cp .env.example .env
   ```
   *Edit `.env` to include your SMTP credentials so you can receive the OTP emails.*

2. Install dependencies (from the monorepo root):
   ```sh
   pnpm install
   ```

3. Run the development server:
   ```sh
   pnpm run dev
   ```

The server will start on `http://localhost:3000`.

## Endpoints

- `POST /api/auth/send-otp` - Expects `{ "email": "you@example.com" }`
- `POST /api/auth/verify-otp` - Expects `{ "email": "you@example.com", "code": "123456" }`
- `GET /api/user` - Protected route. Pass the returned token in the `Authorization: Bearer <token>` header.
