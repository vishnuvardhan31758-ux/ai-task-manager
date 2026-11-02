# AI Task Manager

A small Next.js and Prisma MVP for creating projects and tasks, with optional OpenAI configuration. The dashboard currently supports listing tasks and creating projects/tasks. It is a single shared workspace, not a multi-user SaaS application.

## Run locally

Requires Node.js 22+ and npm.

```bash
npm ci
cp .env.example .env.local
npm run db:generate
npm run db:push
npm run dev
```

Open <http://localhost:3000>. In development, the access gate is disabled if both `APP_ACCESS_USERNAME` and `APP_ACCESS_PASSWORD` are unset. For `npm run start` in production, set both variables. AI is optional; the dashboard works without an API key.

## Deploy a private single-instance MVP with Docker

The included Docker setup is intended for a single persistent container using SQLite. It is suitable for a private pilot on a Docker-capable host with a persistent volume; it is **not** a multi-region or multi-instance SaaS database setup. The container applies the Prisma schema on startup and stores the SQLite file in the named volume.

1. Copy `.env.example` to `.env`.
2. Set `APP_ACCESS_USERNAME` and a long unique `APP_ACCESS_PASSWORD` in `.env`.
3. Run:

   ```bash
   docker compose up --build -d
   ```

4. Open <http://localhost:3000>. Your browser will request the Basic Auth credentials. For an internet-facing deployment, terminate HTTPS at the hosting provider or reverse proxy; do not expose Basic Auth over plain HTTP.
5. Check health at <http://localhost:3000/api/health>. This endpoint checks database connectivity and is intentionally unauthenticated for platform health probes.

Back up the `task_manager_data` Docker volume regularly. Do not run multiple app replicas against this SQLite deployment. For scale-out, migrate to PostgreSQL, create and review Prisma migrations, and implement user accounts plus per-user authorization before opening it to the public.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma URL; local/Docker default is `file:./dev.db`. |
| `APP_ACCESS_USERNAME` | Production | HTTP Basic Auth username for the private pilot. |
| `APP_ACCESS_PASSWORD` | Production | HTTP Basic Auth password; use a long random secret. |
| `OPENAI_API_KEY` | No | Optional key for AI features. |
| `OPENAI_BASE_URL` | No | Optional OpenAI-compatible API URL. |
| `AI_MODEL` | No | Model name, defaults to `gpt-4o-mini`. |
| `NEXT_PUBLIC_APP_URL` | No | Public site URL for integrations. |

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

The repository changes should be treated as unverified until these commands and the Docker startup flow have been run in the target environment. `npm run db:push` is convenient for this MVP; for a production database and team workflow, generate and review Prisma migrations and use a managed PostgreSQL service.
