# SignSeal IQ

Internal pricing and business management for SignSeal Ltd.

This application is a Next.js App Router application using TypeScript, Tailwind CSS, Prisma ORM and MariaDB/MySQL. Prisma is the application data-access and migration layer; MariaDB remains the production database. SignSeal IQ sits before QuickBooks: it calculates and explains prices, stores quote/job profitability data, and prepares integration points without pretending external systems are configured.

## Implemented Scope

- Login-required internal app with server-side sessions and role foundations.
- Dashboard, New Price, Quotes, Customers, Jobs, Pricing Matrix, Materials, Labour Rates, Suppliers, Reports and Settings.
- Dark-mode-first SignSeal IQ interface with the official logo and persisted Dark/Light/System appearance preference.
- Deterministic pricing engine covering material markup, labour, outsourced production, travel, wastage, contingency, risk, rush/weekend/difficult-access premiums, discounts, VAT, gross profit, gross margin and effective hourly return.
- Transparent pricing breakdown and manual override validation.
- Editable Prisma schema for users, customers, quotes, quote versions, quote costs, jobs, job costs, materials, suppliers, labour rates, pricing rules, pricing matrix, AI recommendations, settings, attachments and audit logs.
- Initial Prisma migration for safe future `prisma migrate deploy` usage.
- Seed data for labour rates, pricing rules and pricing matrix examples.
- Optional server-side OpenAI Pricing Advisor using the Responses API with Zod validation.
- QuickBooks integration boundary and settings status behind `QUICKBOOKS_ENABLED`.
- Unit tests for pricing calculations, validation, permissions, AI response validation and quote wording.

## Architecture

Main files:

- `prisma/schema.prisma` - relational database schema for MariaDB/MySQL.
- `prisma/migrations/20260714182000_initial_schema/migration.sql` - initial migration generated from the current schema.
- `prisma/seed.ts` - editable starter rules, rates and matrix examples.
- `src/lib/pricing/engine.ts` - deterministic pricing source of truth.
- `src/lib/openai/advisor.ts` - optional AI advisor service.
- `src/lib/quickbooks.ts` - QuickBooks integration interface and disabled/not-configured state.
- `src/lib/auth.ts` - secure server-side session handling.
- `src/app/(app)` - authenticated app areas.
- `src/app/api/pricing/calculate` - server-side calculation endpoint.
- `src/app/api/ai/pricing-advisor` - server-side AI endpoint.
- `scripts/deploy-production.sh` - tracked example production deployment script.

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

Do not commit `.env` files. Do not expose the MariaDB port publicly.

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

New empty production database:

```bash
npm ci
npm run db:generate
npm run db:deploy
npm run build
npm run start
```

Existing production database baseline:

1. Take a full MariaDB backup before doing anything.
2. Confirm the existing production schema matches `prisma/schema.prisma`.
3. Do not run `prisma migrate reset` in production.
4. If the schema already exists and matches this initial migration, mark it as applied:

```bash
npx prisma migrate resolve --applied 20260714182000_initial_schema
```

After the baseline is recorded, future deployments can safely use:

```bash
npx prisma migrate deploy
```

If the production schema does not match the migration, stop and create a deliberate follow-up migration. Do not silently change or reset production data.

## Default Admin Creation

There is no public registration. Create the first admin from the server shell:

```bash
$env:ADMIN_EMAIL="admin@signseal.co.uk"
$env:ADMIN_PASSWORD="use-a-long-random-password"
$env:ADMIN_NAME="SignSeal Admin"
npm run admin:create
```

## Production Deployment Behind Plesk/Nginx

Production currently deploys from:

```bash
/var/www/vhosts/sign-seal.co.uk/iq.sign-seal.co.uk/deploy.sh
```

PM2 settings:

- Application name: `signseal-iq`
- Node interpreter: `/root/.nvm/versions/node/v22.23.1/bin/node`
- Production port: `3001`
- Next.js output: `standalone`

The application should remain bound behind the Plesk/Nginx reverse proxy. Do not open port `3001` publicly.

The deployment process should:

1. Pull/reset to `origin/main`.
2. Run `npm ci`.
3. Generate the Prisma client.
4. Apply database schema updates with `prisma migrate deploy` after the production database has been baselined.
5. Build the application.
6. Copy `.next/static` into `.next/standalone/.next/static`.
7. Copy `public` into `.next/standalone/public`.
8. Restart the `signseal-iq` PM2 process.
9. Save the PM2 process list.

A tracked example script is included:

```bash
bash scripts/deploy-production.sh
```

Because production deploys as `root` while files are owned by the Plesk domain user, Git may require:

```bash
git config --global --add safe.directory /var/www/vhosts/sign-seal.co.uk/iq.sign-seal.co.uk
```

The preferred future approach is to run deployments under a dedicated deployment user or the Plesk domain user rather than `root`.

Docker deployment for local or isolated environments:

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


## Client Project Portal

SignSeal IQ includes a secure client-facing project portal for multi-site signage programmes. Internal users manage portal records from `Clients & Portal`; client users authenticate through the normal login flow and are redirected to `/portal`. The internal portal module includes CRUD screens for clients, programmes, projects, sites, client users/invitations, action requests, activity and email templates, plus a step-by-step portal creation wizard.

Portal data model highlights:

- Portal-enabled customers, client users and secure invitation/reset-token tables.
- Programmes grouping multiple client projects, with each project containing one or more Sites.
- Per-project and per-site status, timeline/progress, documents, messages, artwork approvals and action requests.
- Client-visible versus internal-only visibility on messages and documents.
- Email templates and notification queue records for invitations, project updates, artwork proofs, approvals, uploads, installation confirmations and assigned action requests.
- Audit hooks for portal messages, approvals and action completion.

Security rules:

- Client users must be linked to a `Customer` via `User.customerId`.
- Portal queries enforce customer isolation server-side; clients cannot access another organisation by changing a URL.
- Internal-only messages/documents are filtered out for client users.
- Client users are redirected away from the internal ERP shell.

Demo data:

`npm run db:seed` creates optional HEARTS Academy Trust portal demo records, including the `HEARTS School Signage Project 2026` programme and six school/head-office projects. It does not create real client passwords or send invitations automatically.

Operational notes:

- Apply migrations with `npm run db:deploy` in production.
- Run `npm run db:generate` after schema changes.
- Run `npm run test` to verify client isolation and artwork approval rules.
- File uploads currently store metadata/storage keys; connect the storage provider before enabling real binary uploads.
- Email notifications are queued against configurable templates; connect SMTP/provider delivery before enabling live sends.

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

