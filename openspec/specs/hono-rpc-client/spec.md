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

### Requirement: Frontend uses hc<AppType>() client
The frontend SHALL replace the axios-based API client (`api.ts`) with a Hono RPC client constructed via `hc<AppType>(baseUrl)`. The existing `helicopterApi`, `flightApi`, `statsApi`, and `maintenanceApi` export shapes SHALL be preserved so that call sites in components require no changes beyond the import.

#### Scenario: Typed request parameters
- **WHEN** a frontend component calls `flightApi.create(data)`
- **THEN** TypeScript SHALL infer the exact shape of `data` from the backend route's Zod validator without any manual type annotation

#### Scenario: Typed response data
- **WHEN** a frontend component awaits an API call
- **THEN** the resolved value SHALL be typed according to the backend route's `c.json()` return type, with no `any` or manual casting required

#### Scenario: Base URL from environment variable
- **WHEN** the frontend initialises the Hono client
- **THEN** the base URL SHALL be read from `import.meta.env.VITE_API_URL` (defaulting to `http://localhost:3000/api`), matching the existing behaviour

### Requirement: Shared types in packages/shared
Types that are used by both the backend and frontend (e.g. domain entity shapes, pagination types) SHALL be defined in `packages/shared/src/` and imported via `@helilog/shared`. Types that are purely derived from the Hono router (request/response shapes) do NOT need to be in `packages/shared`; they are inferred through `AppType`.

#### Scenario: Shared type importable from both sides
- **WHEN** `apps/backend` and `apps/frontend` both import a type from `@helilog/shared`
- **THEN** the import SHALL resolve correctly in both TypeScript compilation contexts (Node ESM for backend, browser ESM for frontend)
