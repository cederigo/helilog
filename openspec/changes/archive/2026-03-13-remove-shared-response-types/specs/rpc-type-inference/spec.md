## ADDED Requirements

### Requirement: API module removes type assertions from Hono RPC calls

`apps/frontend/src/lib/api.ts` SHALL NOT use TypeScript `as` type assertions to coerce response types from the Hono RPC client. Response types SHALL be inferred from `hc<AppType>()`.

#### Scenario: Response type inferred without cast

- **WHEN** an API wrapper function calls `res.json()` on a Hono RPC response
- **THEN** the return type SHALL be inferred by TypeScript from `AppType` without an `as SomeType` assertion

### Requirement: API module exports derived response types

`apps/frontend/src/lib/api.ts` SHALL export named TypeScript type aliases for each response entity shape, derived from the api function return types using `Awaited<ReturnType<...>>`. Date fields SHALL be typed as `string` (matching the serialized JSON representation).

#### Scenario: Component imports response type from api module

- **WHEN** a frontend component needs the type of a helicopter
- **THEN** it SHALL import `Helicopter` (or equivalent) from `apps/frontend/src/lib/api.ts`

#### Scenario: Derived types stay in sync with backend

- **WHEN** a backend route handler changes its `c.json()` response shape
- **THEN** the derived type exported from `api.ts` SHALL reflect that change automatically at the next TypeScript compilation

### Requirement: API module exports query key constants

`apps/frontend/src/lib/api.ts` SHALL export query key factory objects for each domain (`helicopterKeys`, `flightKeys`, `maintenanceKeys`, `statsKeys`) so that `useQuery` calls and cache invalidations reference a single source of truth.

#### Scenario: Query key reused between useQuery and invalidation

- **WHEN** a component calls `useQuery` and a mutation invalidates the cache
- **THEN** both SHALL reference the same query key constant from `api.ts`, not inline string arrays

### Requirement: Frontend components source response types from api module

Frontend components SHALL import response entity types from `apps/frontend/src/lib/api.ts`, NOT from `@helilog/shared`.

#### Scenario: Component does not import response interfaces from shared

- **WHEN** a frontend component file is inspected
- **THEN** it SHALL NOT import response entity types (`Helicopter`, `Flight`, `MaintenanceRecord`, `DashboardStats`, `MaintenanceAlert`, `WeeklyTrend`, `MonthlyTrend`, `Pagination`, `HelicopterDetail`, `FlightWithHelicopter`) from `@helilog/shared`

#### Scenario: Input types and schemas remain importable from shared

- **WHEN** a frontend form component needs to validate user input
- **THEN** it SHALL still import Zod schemas and input types (e.g. `createHelicopterSchema`, `CreateFlightInput`) from `@helilog/shared`
