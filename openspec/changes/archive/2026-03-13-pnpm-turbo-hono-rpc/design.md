## Context

HeliLog is a small full-stack app (Hono backend, React/Vite frontend) currently organised as two npm workspaces (`backend/`, `frontend/`). Types are duplicated: Prisma generates backend types and the frontend maintains its own `types/index.ts` mirror. The API client is an axios instance with manually-typed methods. There is no build orchestration — developers run backend and frontend scripts independently.

The goal is to modernise the repo structure, eliminate type drift, and use Hono's built-in RPC mechanism to derive the frontend API client directly from the backend router type.

## Goals / Non-Goals

**Goals:**
- Move to pnpm workspaces with the standard `apps/*` + `packages/*` layout
- Add Turborepo for parallel, cached `dev`, `build`, and `lint` pipelines
- Export `AppType` from the backend so the frontend can use `hc<AppType>()` for a fully typed, zero-maintenance API client
- Centralise shared TypeScript types in `packages/shared`
- Preserve all existing runtime behaviour (routes, DB schema, UI features)

**Non-Goals:**
- Changing any business logic, routes, or DB schema
- Adding new features beyond what is required for the migration
- Dockerising or changing the deployment target
- Adding a test suite (none exists today)

## Decisions

### 1. `packages/shared` contains types only (no runtime code initially)

**Decision:** `packages/shared` exports TypeScript types that are consumed by both `apps/backend` and `apps/frontend`. It does NOT re-export Prisma client or any runtime code.

**Rationale:** Hono RPC already provides end-to-end type safety through `AppType`. Shared runtime utilities are not needed yet; adding them would increase coupling without benefit. Types like request/response shapes can be co-located with the Hono router and inferred on the frontend via `ClientRequestOptions`.

**Alternative considered:** Put Prisma-generated types in `packages/shared`. Rejected — Prisma types are tightly coupled to the DB schema and belong with the backend. Exposing them to the frontend would leak implementation details.

### 2. Hono RPC via `@hono/client` (`hc`) replacing axios

**Decision:** The backend's main router is typed with `const app = new Hono<...>()` and `export type AppType = typeof app`. The frontend imports this type and constructs a client with `hc<AppType>(baseUrl)`. The existing `helicopterApi`, `flightApi`, etc. wrappers are rewritten to use the typed client.

**Rationale:** Zero manual type maintenance. Adding or changing a route automatically propagates types to the frontend at compile time. Type errors surface before runtime.

**Alternative considered:** Keep axios + OpenAPI codegen. Rejected — adds tooling complexity (openapi spec generation, codegen step) with no advantage over direct type sharing in a monorepo.

### 3. Turborepo pipeline: `dev`, `build`, `lint`, `db:migrate`

**Decision:** `turbo.json` defines:
- `build`: depends on `^build` (dependencies built first); outputs `dist/**`
- `dev`: persistent task, no cache, runs in parallel
- `lint`: independent per-package
- `db:migrate` / `db:generate`: backend-only, not cached

**Rationale:** Turborepo's remote cache and dependency graph are overkill for two apps today, but the pipeline config is cheap to add and will pay off as the project grows. `dev` runs both servers with a single `turbo dev` at the root.

**Alternative considered:** Just `concurrently` for dev. Rejected — doesn't give build caching or a consistent task graph.

### 4. Directory layout

```
helilog/
├── apps/
│   ├── backend/          # Hono + Prisma
│   └── frontend/         # React + Vite
├── packages/
│   └── shared/           # Shared TS types
├── package.json          # Root (pnpm workspaces)
├── pnpm-workspace.yaml
└── turbo.json
```

`packages/shared` is a minimal TypeScript package (`tsconfig`, `package.json` with `exports`). Backend and frontend reference it via the pnpm workspace protocol: `"@helilog/shared": "workspace:*"`.

## Risks / Trade-offs

- **Hono RPC requires route handlers to use `c.json()` and explicit status codes** — any handler returning a raw `Response` or using `c.text()` for JSON will lose type information. All routes must be audited.
  → Mitigation: review every route in `routes/*.ts` during implementation; add `satisfies` assertions where helpful.

- **Path changes break any external scripts or documentation** referencing `backend/` or `frontend/` directly.
  → Mitigation: update `CLAUDE.md` and any deployment scripts as part of the migration task.

- **pnpm hoisting behaviour differs from npm** — some packages that resolved transitively under npm may need explicit listing.
  → Mitigation: run `pnpm install` and fix any resolution errors before proceeding to feature work.

- **Turborepo caching of `build` for `packages/shared`** must happen before `apps/backend` and `apps/frontend` build. If the dependency graph in `turbo.json` is wrong, builds will fail on CI.
  → Mitigation: test `turbo build` from root before closing the task.

## Migration Plan

1. Install pnpm globally (if not present); delete `node_modules` and `package-lock.json` files.
2. Create root `package.json` (workspaces), `pnpm-workspace.yaml`, `turbo.json`.
3. Move `backend/` → `apps/backend/`, `frontend/` → `apps/frontend/`; update all internal paths.
4. Create `packages/shared` with shared types extracted from `frontend/src/types/index.ts`.
5. Update backend to depend on `@helilog/shared`, export `AppType`.
6. Update frontend to depend on `@helilog/shared`, replace axios client with `hc<AppType>`.
7. Run `pnpm install` from root; verify `turbo dev` starts both servers.
8. Run `turbo build`; fix any TypeScript errors.
9. Update `CLAUDE.md` with new commands and paths.

**Rollback:** The current state is committed; reverting the migration commit(s) restores the original structure.

## Open Questions

- Should `packages/shared` also export Zod schemas (currently defined per-route in the backend) so the frontend can reuse them for form validation? — Deferred; can be added later without structural changes.
- Is a root-level `.env` or per-app `.env` the right convention with Turborepo? — Keep per-app `.env` files for now (Turborepo supports this via `dotenv` loading in each package).
