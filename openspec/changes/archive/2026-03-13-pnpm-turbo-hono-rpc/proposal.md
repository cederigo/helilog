## Why

The project currently uses npm workspaces with a flat `backend/`+`frontend/` layout, no build orchestration, and a manual axios-based API client with hand-maintained types. Migrating to pnpm workspaces + Turborepo + Hono RPC eliminates the type drift between backend and frontend, introduces fast cached builds, and gives a single source of truth for API contracts.

## What Changes

- **BREAKING** Restructure workspace layout from `backend/` + `frontend/` to `apps/backend/` + `apps/frontend/` + `packages/shared/`
- **BREAKING** Replace npm with pnpm as the package manager (lockfile, scripts, workspace protocol)
- Add Turborepo (`turbo.json`) for orchestrated, cached builds and dev tasks
- Replace hand-written axios API client (`frontend/src/lib/api.ts`) with a fully typed Hono RPC client generated from the backend's router type
- Extract shared TypeScript types (currently duplicated in `frontend/src/types/index.ts` and Prisma-derived backend types) into `packages/shared`
- Update all import paths, environment config, and tooling scripts to reflect the new structure

## Capabilities

### New Capabilities

- `monorepo-tooling`: pnpm workspace + Turborepo setup — workspace config, `turbo.json` pipeline, root scripts
- `hono-rpc-client`: Typed Hono RPC client on the frontend — backend exports `AppType`, frontend imports and uses `hc<AppType>()` instead of axios

### Modified Capabilities

- `backend-domain-structure`: Directory path changes from `backend/` → `apps/backend/`; shared types move to `packages/shared`

## Impact

- All `package.json` files (root, backend, frontend) — replace npm workspace config with pnpm, add turbo
- `backend/src/index.ts` → `apps/backend/src/index.ts` — must export `AppType` for RPC client
- `backend/src/routes/*.ts` — routes must use `app.route()` pattern compatible with Hono RPC (return typed responses via `c.json()`)
- `frontend/src/lib/api.ts` — replaced by `hc<AppType>()` Hono client
- `frontend/src/types/index.ts` — types move to `packages/shared/src/types.ts`
- CI / deployment scripts — any references to `cd backend` or `cd frontend` must be updated
