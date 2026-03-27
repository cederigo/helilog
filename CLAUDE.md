# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeliLog is a full-stack web app for logging RC helicopter flights. It uses **pnpm workspaces** with **Turborepo** for orchestrated builds. The repo is structured as:

```
apps/backend/    # Hono + Prisma + SQLite server
apps/frontend/   # React + Vite + TypeScript client
packages/shared/ # Shared TypeScript types and Zod schemas
```

## Package Manager & Build Tool

- **Package manager**: pnpm (use `pnpm` not `npm`)
- **Build orchestration**: Turborepo (`turbo`)
- Run all commands from the **repo root** unless working on a specific package

## Commands

### Root (run from repo root)

```bash
pnpm dev         # Start all dev servers concurrently (backend + frontend)
pnpm build       # Build all packages in dependency order
pnpm lint        # Lint all packages
pnpm typecheck   # TypeScript check all packages
pnpm format      # Format all packages
```

### Backend (`cd apps/backend`)

```bash
pnpm dev         # Start dev server with hot reload (tsx watch)
pnpm build       # Emit .d.ts declarations + esbuild bundle to dist/
pnpm start       # Run production build
pnpm db:migrate  # Run Prisma migrations (creates/updates SQLite DB)
pnpm db:generate # Regenerate Prisma client after schema changes
pnpm db:studio   # Open Prisma Studio GUI
```

### Frontend (`cd apps/frontend`)

```bash
pnpm dev         # Start Vite dev server on :5173
pnpm build       # TypeScript check + Vite build
pnpm lint        # ESLint
pnpm preview     # Preview production build
```

### Database migration workflow

```bash
cd apps/backend
pnpm db:migrate -- --name your_migration_name
```

## Architecture

### Backend (`apps/backend`)

- **Entry point**: `apps/backend/src/index.ts` — sets up Hono app with CORS, logger middleware, mounts routes under `/api/`. Exports `AppType` for Hono RPC client.
- **AppType**: `export type AppType = typeof app` — the fully-typed Hono router, used by the frontend's `hc<AppType>()` client
- **Database**: `apps/backend/src/db.ts` — singleton Prisma client using `@prisma/adapter-libsql`; `DATABASE_URL` defaults to `file:./dev.db`
- **Routes**: Domain modules under `apps/backend/src/{helicopter,flight,stats,maintenance}/` — each `*.routes.ts` file exports a typed Hono sub-router using method chaining (required for RPC type inference)
- **Schema**: `apps/backend/prisma/schema.prisma` — three models: `Helicopter`, `Flight`, `MaintenanceRecord`

### Frontend (`apps/frontend`)

- **Entry**: `apps/frontend/src/main.tsx` → `App.tsx`
- **Routing**: React Router v7, routes defined in `App.tsx`
- **API client**: `apps/frontend/src/lib/api.ts` — Hono RPC client using `hc<AppType>()` from `hono/client`. Base URL from `VITE_API_URL` env var (default `http://localhost:3000`). Exports `helicopterApi`, `flightApi`, `statsApi`, `maintenanceApi`.
- **Components**: `apps/frontend/src/components/` — page-level components

### Shared (`packages/shared`)

- **Types & Zod schemas**: `packages/shared/src/index.ts` — shared TypeScript interfaces and Zod validation schemas used by both backend and frontend

## Hono RPC

The backend exports `AppType` from `apps/backend/src/index.ts`. The frontend imports it as a type-only import and uses `hc<AppType>(baseUrl)` to get a fully typed HTTP client. **All route handlers must use `c.json()` for responses and routes must be defined via method chaining** (not imperative calls) for TypeScript to infer the full type.

## Environment Variables

**Backend** (`apps/backend/.env`):

- `DATABASE_URL` — SQLite file path (default: `file:./dev.db`)
- `CORS_ORIGIN` — comma-separated origins (default: `http://localhost:5173,http://localhost:3000`)

**Frontend** (`apps/frontend/.env.local`):

- `VITE_API_URL` — backend server root URL, **without `/api` suffix** (default: `http://localhost:3000`)

## Docker

Build images from the **repo root** using `turbo prune` for minimal contexts:

```bash
docker build -f apps/backend/Dockerfile .
docker build -f apps/frontend/Dockerfile .
docker-compose up  # Uses both
```

## OpenSpec

The `openspec/` directory contains a spec-driven development workflow. Changes go through proposal → design → specs → implementation phases. Archived completed changes live in `openspec/changes/archive/`.

## Coding Standards

- Keep functions small and easy to read.
- Use explicit parameter/return types when they improve clarity.
- Prefer `unknown` over `any` for unknown values.
- Use `const` by default, `let` only when reassignment is needed.
- Prefer `for...of`, optional chaining, nullish coalescing, and template literals.
- Use early returns to reduce nesting.
- Use `async/await` instead of promise chains.
- Throw `Error` objects with clear messages.
- Extract magic numbers/strings into named constants when reused.

## Testing

- Keep assertions inside `test()`/`it()` blocks.
- Prefer async/await over done callbacks.
- Do not commit `.only` or `.skip`.
- Prefer module-level mocks (for example `mock.module(...)`) over adding DI-only test seams when possible.
