## Requirements

### Requirement: Backend exports AppType

The backend entry point (`apps/backend/src/index.ts`) SHALL export a type alias `AppType` equal to `typeof app` where `app` is the root Hono application instance. This type SHALL be importable by the frontend without importing any runtime backend code.

#### Scenario: AppType is a named export

- **WHEN** a TypeScript consumer imports from the backend package
- **THEN** `import type { AppType } from '@helilog/backend'` (or the equivalent relative/package path) SHALL resolve without errors and expose the full typed router

#### Scenario: No runtime backend code imported on frontend

- **WHEN** the frontend build runs
- **THEN** the compiled frontend bundle SHALL NOT include any Node.js-only backend modules (e.g. Prisma, libsql)

### Requirement: All route handlers return typed JSON responses

Every Hono route handler in `apps/backend/src/` SHALL return responses using `c.json(data, statusCode)` so that the RPC type inference can infer the exact response shape per status code. Handlers SHALL NOT return raw `new Response(...)` objects or use `c.text()` for JSON payloads.

#### Scenario: Successful response is typed

- **WHEN** a route handler returns `c.json({ id: 1, name: 'foo' }, 200)`
- **THEN** the Hono RPC client on the frontend SHALL infer the response body type as `{ id: number; name: string }` for a 200 status

#### Scenario: Error response is typed

- **WHEN** a route handler returns `c.json({ error: 'Not found' }, 404)`
- **THEN** the Hono RPC client on the frontend SHALL include a 404 branch in the inferred response union type

### Requirement: Shared types in packages/shared

Types used by both the backend and frontend for INPUT validation (Zod schemas, input type aliases) SHALL be defined in `packages/shared/src/` and imported via `@helilog/shared`. Response entity types (shapes of data returned by the API) SHALL NOT be defined in `packages/shared`; they SHALL be inferred through `AppType` and re-exported as derived type aliases from `apps/frontend/src/lib/api.ts`.

#### Scenario: Shared type importable from both sides

- **WHEN** `apps/backend` and `apps/frontend` both import a type from `@helilog/shared`
- **THEN** the import SHALL resolve correctly in both TypeScript compilation contexts (Node ESM for backend, browser ESM for frontend)

#### Scenario: Response entity types absent from shared package

- **WHEN** `packages/shared/src/index.ts` is inspected
- **THEN** it SHALL NOT export response entity interfaces (`Helicopter`, `Flight`, `FlightWithHelicopter`, `HelicopterDetail`, `MaintenanceRecord`, `DashboardStats`, `MaintenanceAlert`, `WeeklyTrend`, `MonthlyTrend`, `Pagination`)

#### Scenario: Input schemas and types remain in shared package

- **WHEN** `packages/shared/src/index.ts` is inspected
- **THEN** it SHALL export Zod schemas (`createHelicopterSchema`, `updateHelicopterSchema`, `createFlightSchema`, `updateFlightSchema`, `createMaintenanceSchema`) and their inferred input types
