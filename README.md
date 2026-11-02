# AI Task Manager

Next.js + Prisma task and project manager. This repository provides a single shared workspace protected by an HTTP Basic Auth gate. It is an MVP deployment, not a multi-user SaaS: users sharing the configured credentials share the same data. Do not store sensitive or regulated data without adding individual accounts and per-user authorization.

## Local development

Requires Node.js 22+ and Docker (for the included PostgreSQL service).

```bash
cp .env.example .env.local
# For local Docker Postgres, set POSTGRES_PASSWORD in .env (Compose reads .env).
docker compose up -d db
npm ci
npm run db:generate
npm run db:push
npm run dev
```

Open <http://localhost:3000>. In development the access gate is disabled when both `APP_ACCESS_USERNAME` and `APP_ACCESS_PASSWORD` are unset. For production, both are required. The AI integration is optional.

## Deploy on Vercel with managed PostgreSQL

1. Create a managed PostgreSQL database (for example, Neon, Supabase, or another provider) and obtain its connection string. Use the provider's pooled URL for runtime if recommended, plus a direct URL for schema changes if the provider requires it.
2. Import this repository into Vercel and select `deploy/mvp-hardening` for the deployment branch.
3. Set these Vercel environment variables for Preview and Production:
   - `DATABASE_URL`: PostgreSQL connection string with `?schema=public` (URL-encode special characters in credentials).
   - `APP_ACCESS_USERNAME`: a unique deployment username.
   - `APP_ACCESS_PASSWORD`: a long, unique random password.
   - `OPENAI_API_KEY`: optional; only when enabling AI features.
   - `OPENAI_BASE_URL` and `AI_MODEL`: optional provider/model settings.
   - `NEXT_PUBLIC_APP_URL`: the canonical HTTPS deployment URL.
4. Before initial launch, create the database schema from the repository root using the production connection string in a secure environment:
   ```bash
   npm ci
   npx prisma generate
   npx prisma db push
   ```
   Never commit the connection string or put it in a public CI log. For subsequent schema changes, adopt reviewed Prisma migrations (`prisma migrate dev` in development and `prisma migrate deploy` in production) rather than relying on `db push`.
5. Deploy and verify `https://YOUR-DOMAIN/api/health` returns 200. This endpoint checks database connectivity and is intentionally unauthenticated for hosting health probes. All other app/API paths require the configured Basic Auth credentials.
6. Configure a custom domain and confirm HTTPS is active before sharing credentials.

The Basic Auth gate is suitable only for a private pilot/internal MVP. It is not individual identity, account recovery, roles, or per-user data isolation. Add a real identity provider and ownership checks before making this a public multi-user product. For global traffic, use the provider's managed Postgres region near the app or supported connection pooling; this application is not multi-region write replicated.

## Self-host with Docker Compose

Copy `.env.example` to `.env`, set a strong `POSTGRES_PASSWORD`, `APP_ACCESS_USERNAME`, and `APP_ACCESS_PASSWORD`, then run:

```bash
docker compose up --build -d
```

Compose starts PostgreSQL with a persistent Docker volume and the app applies the Prisma schema on startup. Put it behind HTTPS using your hosting platform or reverse proxy. Back up PostgreSQL regularly.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

These checks must be run in your CI or local environment before production; a GitHub file update alone does not prove a successful build or deployment.
