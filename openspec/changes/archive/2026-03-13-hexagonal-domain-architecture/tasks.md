## 1. Shared Foundation

- [x] 1.1 Create `src/shared/errors.ts` with base `AppError` class
- [x] 1.2 Create `src/shared/types.ts` with shared types (`PaginationParams`, `PaginatedResult<T>`)

## 2. Helicopter Domain

- [x] 2.1 Create `src/helicopter/helicopter.types.ts` with domain types (`Helicopter`, `CreateHelicopterInput`, `UpdateHelicopterInput`)
- [x] 2.2 Create `src/helicopter/helicopter.errors.ts` (`HelicopterNotFoundError`, `DuplicateHelicopterNameError`, `HelicopterHasFlightsError`)
- [x] 2.3 Create `src/helicopter/helicopter.repository.ts` with `HelicopterRepository` interface
- [x] 2.4 Create `src/helicopter/helicopter.prisma.ts` implementing `HelicopterRepository` with Prisma
- [x] 2.5 Create `src/helicopter/helicopter.service.ts` with business logic (list, getById, create with duplicate check, update with duplicate check, delete with flight guard)
- [x] 2.6 Create `src/helicopter/helicopter.schema.ts` with Zod validation schemas
- [x] 2.7 Create `src/helicopter/helicopter.routes.ts` as thin Hono adapter (map domain errors to HTTP)

## 3. Flight Domain

- [x] 3.1 Create `src/flight/flight.types.ts` with domain types (`Flight`, `CreateFlightInput`, `UpdateFlightInput`, `FlightFilters`)
- [x] 3.2 Create `src/flight/flight.errors.ts` (`FlightNotFoundError`)
- [x] 3.3 Create `src/flight/flight.repository.ts` with `FlightRepository` interface (including `countByHelicopterId`, `sumDurationByHelicopterId`)
- [x] 3.4 Create `src/flight/flight.prisma.ts` implementing `FlightRepository` with Prisma
- [x] 3.5 Create `src/flight/flight.service.ts` with business logic (list with filters/pagination, getById, logFlight + recalc hours, updateFlight + recalc hours, deleteFlight + recalc hours)
- [x] 3.6 Create `src/flight/flight.schema.ts` with Zod validation schemas
- [x] 3.7 Create `src/flight/flight.routes.ts` as thin Hono adapter

## 4. Maintenance Domain

- [x] 4.1 Create `src/maintenance/maintenance.types.ts`
- [x] 4.2 Create `src/maintenance/maintenance.errors.ts` (`MaintenanceRecordNotFoundError`)
- [x] 4.3 Create `src/maintenance/maintenance.repository.ts` with `MaintenanceRepository` interface
- [x] 4.4 Create `src/maintenance/maintenance.prisma.ts` implementing `MaintenanceRepository` with Prisma
- [x] 4.5 Create `src/maintenance/maintenance.service.ts` with business logic
- [x] 4.6 Create `src/maintenance/maintenance.schema.ts` with Zod validation schemas
- [x] 4.7 Create `src/maintenance/maintenance.routes.ts` as thin Hono adapter

## 5. Stats Domain

- [x] 5.1 Create `src/stats/stats.types.ts` with response types (`OverallStats`, `WeeklyTrends`, `MonthlyTrends`)
- [x] 5.2 Create `src/stats/stats.repository.ts` with `StatsRepository` interface
- [x] 5.3 Create `src/stats/stats.prisma.ts` implementing `StatsRepository` with Prisma
- [x] 5.4 Create `src/stats/stats.service.ts` with all aggregation and computation logic (weekly grouping, monthly grouping, overall stats)
- [x] 5.5 Create `src/stats/stats.routes.ts` as thin Hono adapter

## 7. Shared Types Package

- [x] 7.1 Create root `package.json` with npm workspaces (`backend`, `frontend`, `packages/shared`)
- [x] 7.2 Create `packages/shared/package.json` and `tsconfig.json`
- [x] 7.3 Create `packages/shared/src/index.ts` with all API-contract types (string dates, no Prisma dependency)
- [x] 7.4 Add `@helilog/shared` dependency to frontend `package.json` and run `npm install`
- [x] 7.5 Update frontend `tsconfig.app.json` to resolve `@helilog/shared`
- [x] 7.6 Replace `frontend/src/types/index.ts` imports with `@helilog/shared` across all components and delete the file
- [x] 7.7 Verify frontend builds cleanly

## 6. Wiring and Cutover

- [x] 6.1 Create `src/container.ts` instantiating all Prisma repositories and services as singletons
- [x] 6.2 Update `src/index.ts` to mount routes from domain modules instead of old `routes/`
- [x] 6.3 Delete `backend/src/routes/` directory
- [x] 6.4 Verify all existing API endpoints respond correctly (manual smoke test or existing behaviour preserved)
