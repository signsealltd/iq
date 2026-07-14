# SignSeal Pricing Assist

Internal pricing, quotation and job-profitability tool for SignSeal Ltd.

This application is a Next.js App Router application using TypeScript, Tailwind CSS, Prisma and MariaDB/MySQL. It is designed to sit before QuickBooks: it calculates and explains prices, stores quote/job profitability data, and prepares integration points without pretending external systems are configured.

## Implemented Scope

- Login-required internal app with server-side sessions and role foundations.
- Dashboard, New Price, Quotes, Customers, Jobs, Pricing Matrix, Materials, Labour Rates, Suppliers, Settings and Reports.
- Deterministic pricing engine covering material markup, labour, outsourced production, travel, wastage, contingency, risk, rush/weekend/difficult-access premiums, discounts, VAT, gross profit, gross margin and effective hourly return.
- Transparent pricing breakdown and manual override validation.
- Editable Prisma schema for users, customers, quotes, quote versions, quote costs, jobs, job costs, materials, suppliers, labour rates, pricing rules, pricing matrix, AI recommendations, settings, attachments and audit logs.
- Seed data for labour rates, pricing rules and pricing matrix examples.
- Optional server-side OpenAI Pricing Advisor using the Responses API with Zod validation.
- QuickBooks integration boundary and settings status behind `QUICKBOOKS_ENABLED`.
- Unit tests for pricing calculations, validation, permissions, AI response validation and quote wording.

## Architecture

Main files:

- `prisma/schema.prisma` - relational database schema for MariaDB/MySQL.
- `prisma/seed.ts` - editable starter rules, rates and matrix examples.
- `src/lib/pricing/engine.ts` - deterministic pricing source of truth.
- `src/lib/openai/advisor.ts` - optional AI advisor service.
- `src/lib/quickbooks.ts` - QuickBooks integration interface and disabled/not-configured state.
- `src/lib/auth.ts` - secure server-side session handling.
- `src/app/(app)` - authenticated app areas.
- `src/app/api/pricing/calculate` - server-side calculation endpoint.
- `src/app/api/ai/pricing-advisor` - server-side AI endpoint.

## Environment

Copy `.env.example` to `.env` and set real values:

```bash
DATABASE_URL="mysql://signseal_user:change_me@127.0.0.1:3306/signseal_pricing"
AUTH_SECRET="replace-with-at-least-32-random-characters"
APP_URL="http://localhost:3000"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
QUICKBOOKS_ENABLED="false"
QB_ENCRYPTION_KEY=""
VAT_RATE="0.20"
```

Do not commit `.env` files.

## Development Setup

```bash
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed
$env:ADMIN_EMAIL="admin@signseal.local"; $env:ADMIN_PASSWORD="change-this-long-password"; npm run admin:create
npm run dev
```

Open `http://localhost:3000`.

## Database Migrations

Development:

```bash
npm run db:migrate
npm run db:seed
```

Production:

```bash
npm ci
npm run db:generate
npm run db:deploy
npm run build
npm run start
```

## Default Admin Creation

There is no public registration. Create the first admin from the server shell:

```bash
$env:ADMIN_EMAIL="admin@signseal.co.uk"
$env:ADMIN_PASSWORD="use-a-long-random-password"
$env:ADMIN_NAME="SignSeal Admin"
npm run admin:create
```

## Production Deployment Behind Plesk/Nginx

1. Provision a MariaDB database and user.
2. Set all environment variables in Plesk or the process manager.
3. Run `npm ci`.
4. Run `npm run db:generate`.
5. Run `npm run db:deploy`.
6. Run `npm run build`.
7. Start with `npm run start` or a process manager that runs `next start`.
8. Configure Nginx/Plesk reverse proxy to the Node process, typically port `3000`.
9. Ensure HTTPS is enabled so secure cookies are used in production.

Docker deployment:

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

## Backup And Restore

Backup:

```bash
mysqldump -u signseal_user -p signseal_pricing > signseal_pricing_backup.sql
```

Restore:

```bash
mysql -u signseal_user -p signseal_pricing < signseal_pricing_backup.sql
```

Schedule automated database backups in Plesk and store copies outside the web root.

## OpenAI Notes

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The app sends structured job/pricing context only. The AI advisor returns validated JSON and cannot alter a quote unless a user explicitly applies a recommendation.

## QuickBooks Notes

QuickBooks is intentionally not wired to fake OAuth. Configure:

- QuickBooks company ID
- Client ID
- Client secret as an encrypted setting
- Redirect URI
- `QUICKBOOKS_ENABLED=true`

The service boundary already includes import customers, export approved quote, create estimate, convert estimate to invoice, sync payment status, and sync products/services.

## Security Notes

- Login is required.
- No public registration.
- Admin-created users.
- Role foundations: Admin, Director, Estimator, Production, Installer, Read Only.
- HTTP-only cookies.
- Rate limiting on login and AI endpoints.
- Server-side Zod validation.
- Audit log model included for important actions.
- Secrets stay in environment variables or encrypted settings.
- Uploaded files should be validated by MIME type, extension, size and storage policy before enabling attachment upload endpoints.

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Remaining Enhancements

- Full CRUD forms for customers, quotes, matrix entries, materials, suppliers and labour rates.
- Quote PDF generation and email delivery.
- Quote save/revise/duplicate UI wired to approval workflow.
- Attachment upload storage with antivirus scanning.
- Encrypted settings editor for QuickBooks secrets.
- Semantic similar-job search or embeddings.
