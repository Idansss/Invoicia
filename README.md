# Invoicia — The best electronic invoice (MVP)

Invoicia is a multi-tenant invoicing SaaS built around a core idea: **structured invoice data is the source of truth**. PDFs are renderings; exports (UBL/Peppol) come from the same canonical model.

This repo ships a working MVP with an architecture that scales toward global compliance packs (EN 16931 / Peppol BIS) and clearance/transport adapters (scaffolded).

## Features (MVP)
- Multi-tenant organizations, roles, audit trail
- Customers, products, quotes (scaffold), invoices (draft/sent/paid/void), credit notes
- Hosted invoice page (unguessable token), view tracking, dispute/change requests
- Send invoice email with **PDF attachment** + hosted link (Mailhog in dev)
- Stripe Checkout payments + webhook → marks invoice paid, generates receipt PDF, emails receipt
- Reminders + late-fee automation via BullMQ worker (Redis)
- Compliance engine: base validation + **UBL 2.1 XML export** (Peppol mode scaffold)

## Tech
Next.js (App Router) + TypeScript + Tailwind + shadcn-style UI components, Prisma + Postgres, NextAuth, Stripe, Nodemailer, BullMQ, React-PDF, UBL XML exporter.

## Local setup
1) Start dependencies:
```bash
docker compose up -d
```

If Docker isn't available on your machine, you can still run Invoicia using a locally installed Postgres:
- Ensure Postgres is running
- Set `DATABASE_URL` in `.env` to your local Postgres
- Run `pnpm db:migrate` and `pnpm db:seed`

2) Configure env:
```bash
copy .env.example .env
```

3) Install dependencies:
```bash
pnpm install
```

4) Migrate + seed:
```bash
pnpm db:migrate
pnpm db:seed
```

5) Run the app:
```bash
pnpm dev
```

Optional (recommended for reminders/late fees):
```bash
pnpm worker
```

## Environment variables
This repo loads env vars from the root `.env` via `dotenv-cli` (see root `package.json` scripts).

Core:
- `DATABASE_URL`: Postgres connection string (use docker compose defaults)
- `REDIS_URL`: Redis connection string (BullMQ)
- `NEXTAUTH_SECRET`: long random secret for sessions
- `APP_BASE_URL`: absolute base URL used in hosted invoice links

Email (dev):
- `SMTP_HOST`, `SMTP_PORT`: Mailhog is `localhost:1025`
- `SMTP_FROM`: sender identity

Stripe (dev/test):
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`: required for webhook verification

Testing:
- `TEST_DATABASE_URL` (optional): point tests to an isolated schema, e.g. `?schema=test`

## Mailhog
- Web UI: `http://localhost:8025`
- SMTP: `localhost:1025`

If SMTP isn't reachable (e.g., Mailhog isn't running), emails are written to disk under `storage/emails/` in dev.

## Stripe webhooks (dev)
This app verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`.
- Preferred: use Stripe CLI to forward `checkout.session.completed` to `http://localhost:3000/api/stripe/webhook`
- If you don't have Stripe CLI, you can still test end-to-end by paying in Stripe test mode and configuring a webhook endpoint in the Stripe dashboard.

## Send a test invoice (happy path)
1) Sign up or use seeded users (see `pnpm db:seed` output)
2) Create a customer + product, then create an invoice
3) Click **Send invoice** → check Mailhog for the email with PDF attachment and hosted link
4) Open the hosted link and click **Pay now** (Stripe test mode) → on webhook, invoice becomes **Paid** and a receipt PDF is generated and emailed

## Reminders locally
Reminders and late fees are processed by a separate BullMQ worker:
```bash
pnpm worker
```

## Architecture overview
- `apps/invoicia/src/domain`: canonical invoice domain model + calculations
- `apps/invoicia/src/compliance`: packs (base + peppol scaffolding) + validators + exporters
- `apps/invoicia/src/server`: service layer (invoices, payments, email, storage, jobs) + access control
- `apps/invoicia/src/app`: Next.js routes (seller app + public hosted invoice)

## Roadmap
### Phase 1 (implemented)
- Structured invoice model, PDF rendering, hosted invoice page, Stripe payment + receipt
- Disputes/change requests, credit notes, reminders + late fees, base compliance validation, UBL export

### Phase 2 (scaffolded)
- Country packs (NG/SA/UAE), CIUS validation rules, Peppol transport adapter, government clearance adapters
- Digital signatures (PAdES/XAdES interfaces), long-term archiving (PDF/A-3), buyer wallet/portal
