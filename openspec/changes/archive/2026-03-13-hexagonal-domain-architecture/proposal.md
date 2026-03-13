## Why

All business logic currently lives directly in Hono route handlers, mixing HTTP concerns (request parsing, response formatting) with domain rules (recalculating helicopter hours, enforcing uniqueness, guarding deletes). This makes the logic hard to test in isolation and hard to reason about as the app grows.

## What Changes

- Reorganize `backend/src/` from a flat routes-only structure into domain-driven modules
- Extract business logic from route handlers into dedicated service classes
- Introduce repository interfaces (TypeScript ports) that decouple services from Prisma
- Implement Prisma-backed repository classes that satisfy those interfaces
- Reduce route handlers to thin HTTP adapters: parse → call service → map errors → respond
- Add a `container.ts` to wire up singleton service instances using constructor injection
- Add a `shared/` module for base error classes and shared types

## Capabilities

### New Capabilities

- `backend-domain-structure`: Domain-driven folder layout — one module per domain concept (`helicopter/`, `flight/`, `maintenance/`, `stats/`, `shared/`), each containing types, errors, repository interface, service, Prisma implementation, Zod schema, and Hono routes
- `repository-interfaces`: TypeScript interfaces for each repository, enabling services to be unit-tested by injecting mock implementations
- `domain-services`: Service classes owning all business logic (helicopter hour recalculation, duplicate name enforcement, flight-count delete guard, stats aggregation), decoupled from HTTP and Prisma

### Modified Capabilities

## Impact

- **backend/src/routes/** — replaced by per-domain `*.routes.ts` files
- **backend/src/db.ts** — unchanged; shared by all Prisma repository implementations
- **backend/src/index.ts** — updated to mount routes from domain modules
- No API contract changes — all existing endpoints and response shapes are preserved
- No new npm dependencies required
- Existing frontend is unaffected
