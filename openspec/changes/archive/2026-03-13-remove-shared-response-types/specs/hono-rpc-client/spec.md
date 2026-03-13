## MODIFIED Requirements

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

### Requirement: Frontend uses hc<AppType>() client
The frontend SHALL use a Hono RPC client constructed via `hc<AppType>(baseUrl)`. The existing `helicopterApi`, `flightApi`, `statsApi`, and `maintenanceApi` export shapes SHALL be preserved. Response types SHALL be inferred from the RPC client with no `as` type assertions.

#### Scenario: Typed request parameters
- **WHEN** a frontend component calls `flightApi.create(data)`
- **THEN** TypeScript SHALL infer the exact shape of `data` from the backend route's Zod validator without any manual type annotation

#### Scenario: Typed response data without casting
- **WHEN** an API wrapper function calls `res.json()` on a Hono RPC response
- **THEN** the return type SHALL be inferred from `AppType` with no `as` type assertion

#### Scenario: Base URL from environment variable
- **WHEN** the frontend initialises the Hono client
- **THEN** the base URL SHALL be read from `import.meta.env.VITE_API_URL` (defaulting to `http://localhost:3000`), matching the existing behaviour
