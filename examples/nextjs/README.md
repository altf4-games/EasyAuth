# Next.js EasyAuth Example

Demonstrates a fully functional Next.js 14 App Router integration using `easy-auth`, `easy-auth-sqlite`, and `easy-auth-react`.

## Quick Start

1. `cp .env.example .env`
2. `pnpm install`
3. `pnpm dev`

## Features

- Using the `<AuthModal />` React Component on the Home Route.
- Setting cookies via internal `/api/auth/session` API routes to support strict SSR hydration safely.
- Middleware protection of the `/dashboard` route validating the token implicitly, which the Page then decodes directly using `auth.verifyToken`.
