# Next.js EasyAuth Frontend Example

Demonstrates a fully functional Next.js 14 App Router **frontend-only** integration using `@altf4-auth/react`.

## Important Prerequisites

This Next.js example is designed to act purely as the frontend interface for the `express-sqlite` backend API. You **must** have the `express-sqlite` example running locally on port `3000` for this to work!

There is **no `.env` file required** for this Next.js project because it delegates all secure token validation, SMTP dispatching, and database management identically to the Express backend.

## Quick Start

1. Start the Express backend: `cd ../express-sqlite && pnpm dev`
2. Start this Next.js frontend: `pnpm install && pnpm dev`

## Features

- Uses the `<AuthModal />` React Component bridging perfectly via REST to the Express API.
- Stores the authenticated session securely inside HTTP-only cookies via Server Actions.
- Validates the `/dashboard` route continuously by polling `GET http://localhost:3000/api/user` with a Bearer Token from within a Server Component gracefully.
