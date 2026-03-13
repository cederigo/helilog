## ADDED Requirements

### Requirement: Domain-driven module layout

The backend `src/` directory SHALL be organized into domain modules (`helicopter/`, `flight/`, `maintenance/`, `stats/`, `shared/`). Each domain module SHALL contain all code related to that domain: types, errors, repository interface, service, Prisma implementation, Zod schema, and Hono routes. A `container.ts` at the `src/` root SHALL wire up singleton service instances.

#### Scenario: Domain module is self-contained

- **WHEN** a developer needs to understand or modify helicopter-related behavior
- **THEN** all relevant files (types, errors, repository interface, service, Prisma impl, schema, routes) SHALL be found within `src/helicopter/`

#### Scenario: Consistent file naming

- **WHEN** a file is created within a domain module
- **THEN** it SHALL follow the naming convention `<domain>.<role>.ts` (e.g. `flight.service.ts`, `flight.repository.ts`, `flight.routes.ts`)

#### Scenario: Old routes directory is removed

- **WHEN** the migration is complete
- **THEN** `backend/src/routes/` SHALL no longer exist and SHALL be replaced by per-domain route files

### Requirement: Shared module for cross-cutting types

The `src/shared/` module SHALL provide a base `AppError` class and shared primitive types (e.g. `PaginationParams`, `PaginatedResult`) used across domain modules.

#### Scenario: Domain errors extend AppError

- **WHEN** a domain module defines an error class
- **THEN** it SHALL extend `AppError` from `shared/errors.ts`

#### Scenario: Pagination types are shared

- **WHEN** a repository interface or service returns paginated results
- **THEN** it SHALL use the shared `PaginatedResult<T>` type from `shared/types.ts`

### Requirement: Dependency injection via container.ts

The `src/container.ts` file SHALL instantiate all repository and service classes and export them as named singletons. Route files SHALL import services from `container.ts`.

#### Scenario: Services are singletons

- **WHEN** the application starts
- **THEN** each service SHALL be instantiated exactly once in `container.ts`

#### Scenario: Routes do not instantiate services

- **WHEN** a route handler needs to call a service
- **THEN** it SHALL import the service instance from `container.ts`, not instantiate it inline
