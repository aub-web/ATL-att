# Outbound Attendance

Daily attendance tracking for the outbound team, built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma on SQLite.

## Getting Started

```bash
npm install
npx prisma migrate dev   # creates dev.db and applies the schema
npx prisma db seed       # seeds a handful of sample employees
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the employee clock-in page, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

## Environment variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — SQLite file path for local dev (`file:./dev.db`).
- `ADMIN_PIN` — numeric PIN required to enter `/admin`.
- `ADMIN_SESSION_SECRET` — random secret used to sign the admin session cookie (`openssl rand -hex 32`).

## Seeded employees (local dev)

`prisma/seed.ts` creates a few sample team members you can use to try the employee flow, e.g. `jordan@atlascapture.io`. Manage the real roster from `/admin/roster`.

## Moving to Postgres

The schema and Prisma Client setup use Prisma's driver-adapter workflow, which keeps swapping databases to a few small changes:

1. Change `datasource db { provider = "postgresql" }` in `prisma/schema.prisma`.
2. Point `DATABASE_URL` at a Postgres connection string.
3. Install `@prisma/adapter-pg` and `pg`, and swap the adapter in `src/lib/prisma.ts` (see the comment at the top of that file).
4. Run `npx prisma migrate dev` against the new database.

## Project structure

- `src/app/page.tsx` — employee clock in/out page.
- `src/app/admin/` — PIN-gated admin dashboard, roster management, record editing, CSV export.
- `src/lib/actions/` — server actions for employee punches and admin mutations.
- `src/lib/admin-session.ts` / `src/lib/admin-auth.ts` — signed, short-lived admin session cookie.
- `src/proxy.ts` — protects `/admin/*` pages and `/api/admin/*` routes server-side.
