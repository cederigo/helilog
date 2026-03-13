# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeliLog is a full-stack web app for logging RC helicopter flights. It has a **backend** (Hono + Prisma + SQLite) and a **frontend** (React + Vite + TypeScript) as separate npm workspaces.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # TypeScript compile to dist/
npm start            # Run production build
npm run db:migrate   # Run Prisma migrations (creates/updates SQLite DB)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio GUI
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Start Vite dev server on :5173
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Database migration workflow
```bash
cd backend
npm run db:migrate -- --name your_migration_name
```

## Architecture

### Backend
- **Entry point**: `backend/src/index.ts` — sets up Hono app with CORS, logger middleware, mounts routes under `/api/`
- **Database**: `backend/src/db.ts` — singleton Prisma client using `@prisma/adapter-libsql`; `DATABASE_URL` defaults to `file:./dev.db`
- **Routes**: `backend/src/routes/` — one file per resource (`helicopters.ts`, `flights.ts`, `stats.ts`, `maintenance.ts`). Each uses `@hono/zod-validator` for request validation.
- **Schema**: `backend/prisma/schema.prisma` — three models: `Helicopter`, `Flight`, `MaintenanceRecord`. Deleting a helicopter cascades to its flights and maintenance records.

### Frontend
- **Entry**: `frontend/src/main.tsx` → `App.tsx`
- **Routing**: React Router v7, routes defined in `App.tsx`
- **API client**: `frontend/src/lib/api.ts` — axios instance; base URL from `VITE_API_URL` env var (default `http://localhost:3000/api`). Exports `helicopterApi`, `flightApi`, `statsApi`, `maintenanceApi`.
- **Types**: `frontend/src/types/index.ts` — shared TypeScript types mirroring the Prisma models
- **Components**: `frontend/src/components/` — page-level components (Dashboard, HelicopterList, HelicopterDetail, HelicopterForm, FlightList, FlightForm)

## Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL` — SQLite file path (default: `file:./dev.db`)
- `CORS_ORIGIN` — comma-separated origins (default: `http://localhost:5173,http://localhost:3000`)
- `PORT` — server port (hardcoded to 3000 in `index.ts`)

**Frontend** (`frontend/.env.local`):
- `VITE_API_URL` — backend API base URL (default: `http://localhost:3000/api`)

## OpenSpec

The `openspec/` directory contains a spec-driven development workflow. Changes go through proposal → design → specs → implementation phases. Archived completed changes live in `openspec/changes/archive/`.
