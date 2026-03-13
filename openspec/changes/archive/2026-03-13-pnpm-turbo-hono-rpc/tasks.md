## 1. Repo Scaffolding

- [x] 1.1 Delete root `node_modules/`, `package-lock.json`, `backend/node_modules/`, `frontend/node_modules/`
- [x] 1.2 Create root `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`
- [x] 1.3 Create/update root `package.json` with workspace devDependencies (`turbo`, `typescript`) and `dev`/`build`/`lint` scripts
- [x] 1.4 Create `turbo.json` with `build`, `dev`, `lint`, `db:migrate`, `db:generate` pipeline definitions

## 2. Move App Packages

- [x] 2.1 Move `backend/` → `apps/backend/` (preserve git history with `git mv`)
- [x] 2.2 Move `frontend/` → `apps/frontend/` (preserve git history with `git mv`)
- [x] 2.3 Update `apps/backend/package.json`: fix name to `@helilog/backend`, update any path references
- [x] 2.4 Update `apps/frontend/package.json`: fix name to `@helilog/frontend`, update any path references
- [x] 2.5 Update Vite config, tsconfig paths, and any tooling config files that reference the old root-relative paths

## 3. Create packages/shared

- [x] 3.1 Create `packages/shared/` with `package.json` (name: `@helilog/shared`), `tsconfig.json`, and `src/index.ts`
- [x] 3.2 Move shared TypeScript types from `apps/frontend/src/types/index.ts` into `packages/shared/src/types.ts` and re-export from `src/index.ts`
- [x] 3.3 Add `@helilog/shared` as a `workspace:*` dependency in `apps/backend/package.json` and `apps/frontend/package.json`
- [x] 3.4 Replace `frontend/src/types/index.ts` imports in frontend components with imports from `@helilog/shared`

## 4. Backend — Hono RPC Preparation

- [x] 4.1 Audit all route handlers in `apps/backend/src/routes/` (or domain modules) to ensure every response uses `c.json(data, statusCode)` — fix any that use `c.text()` for JSON or return raw `Response`
- [x] 4.2 Ensure the root Hono app in `apps/backend/src/index.ts` is typed: `const app = new Hono()` and all sub-routes are mounted via `app.route()`
- [x] 4.3 Export `AppType` from `apps/backend/src/index.ts`: `export type AppType = typeof app`
- [x] 4.4 Add `@hono/client` (or verify `hono` version includes it) to `apps/frontend/package.json`

## 5. Frontend — Replace Axios Client with Hono RPC

- [x] 5.1 Remove `axios` dependency from `apps/frontend/package.json`
- [x] 5.2 Rewrite `apps/frontend/src/lib/api.ts` to construct `hc<AppType>(baseUrl)` using `VITE_API_URL` env var
- [x] 5.3 Re-implement `helicopterApi` wrapper using the typed Hono client
- [x] 5.4 Re-implement `flightApi` wrapper using the typed Hono client
- [x] 5.5 Re-implement `statsApi` wrapper using the typed Hono client
- [x] 5.6 Re-implement `maintenanceApi` wrapper using the typed Hono client
- [x] 5.7 Verify all component call sites compile without type errors (`turbo build` or `tsc --noEmit`)

## 6. Install & Verify

- [x] 6.1 Run `pnpm install` from repo root — fix any resolution errors
- [x] 6.2 Run `turbo build` from repo root — fix any TypeScript or build errors
- [x] 6.3 Run `turbo dev` and manually verify both backend and frontend start and API calls succeed

## 7. Dockerfiles

- [x] 7.1 Add root `.dockerignore` excluding `node_modules`, `.git`, `.turbo`, `dist`, and `**/node_modules`
- [x] 7.2 Rewrite `apps/backend/Dockerfile` using the `turbo prune @helilog/backend --docker` pattern: stage 1 prunes, stage 2 installs from `out/json/` (pnpm, frozen lockfile), stage 3 copies `out/full/` and runs `turbo build --filter=@helilog/backend`, stage 4 is the minimal production image (`node:24-alpine`) with only `dist/` and `prisma/`
- [x] 7.3 Rewrite `apps/frontend/Dockerfile` using the `turbo prune @helilog/frontend --docker` pattern: same 3-stage install+build approach, final stage copies `dist/` into `nginx:alpine`
- [x] 7.4 Verify `docker build -f apps/backend/Dockerfile .` succeeds from repo root
- [x] 7.5 Verify `docker build -f apps/frontend/Dockerfile .` succeeds from repo root

## 8. Documentation

- [x] 8.1 Update `CLAUDE.md` with new commands (pnpm, turbo), new paths (`apps/backend`, `apps/frontend`, `packages/shared`), and new architecture notes
