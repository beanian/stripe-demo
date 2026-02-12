# Stripe Elements Demonstrator — AXA Ireland

Compares two Stripe payment approaches for motor insurance:
- **Path A**: Embedded Checkout Sessions (current approach)
- **Path B**: Stripe Elements (proposed upgrade)

## Setup

1. Copy `.env.example` to `.env` and add your Stripe test keys:
   ```
   cp .env.example .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run in development mode:
   ```
   npm run dev
   ```

   - Client: http://localhost:5173
   - Server: http://localhost:4242

## Test Cards

| Card Number          | Scenario        |
|----------------------|-----------------|
| `4242 4242 4242 4242` | Success         |
| `4000 0000 0000 9995` | Decline         |
| `4000 0025 0000 3155` | 3D Secure       |

Use any future expiry date and any 3-digit CVC.

## Architecture

```
packages/
  client/   — React + Vite + Tailwind frontend
  server/   — Express + Stripe backend
```

npm workspaces monorepo with shared TypeScript config.
