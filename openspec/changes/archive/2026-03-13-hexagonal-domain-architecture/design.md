## Context

The backend currently has 4 route files (`helicopters.ts`, `flights.ts`, `maintenance.ts`, `stats.ts`) that each import Prisma directly and mix HTTP parsing, validation, business logic, and DB queries in a single layer. There are no tests. The codebase is small (~600 LOC across routes) but business logic is already leaking across concerns — `updateHelicopterHours` in `flights.ts` directly mutates the `Helicopter` record, and delete guards in `helicopters.ts` query the `Flight` table.

## Goals / Non-Goals

**Goals:**
- Domain-driven folder structure: one module per domain concept
- Repository interfaces that decouple services from Prisma, enabling unit tests with mocks
- Service classes that own all business logic, injected with repositories via constructor
- Thin route handlers that only handle HTTP translation
- No API contract changes — all existing endpoints and response shapes preserved
- No new runtime dependencies

**Non-Goals:**
- Adding tests (this change sets up the structure; tests come after)
- Changing the database schema or API surface
- Introducing a DI container library
- CQRS, event sourcing, or domain events

## Decisions

### 1. Domain-driven modules over technical layers

**Decision**: Organize by domain concept (`helicopter/`, `flight/`, etc.) rather than by layer (`services/`, `repositories/`, `routes/`).

**Rationale**: Each domain module is a vertical slice — all code related to flights lives in `flight/`. This makes it easier to navigate, modify, and reason about a single domain without jumping across directories. Technical layers (service, repository, routes) are still present, just co-located per domain.

**Alternative considered**: Flat layer structure (`services/FlightService.ts`, `repositories/FlightRepository.ts`). Rejected because it encourages thinking in layers rather than domains, and makes cross-cutting changes harder to track.

---

### 2. Repository interfaces as TypeScript interfaces

**Decision**: Each domain defines a TypeScript `interface` in `*.repository.ts`. The Prisma implementation lives in `*.prisma.ts` and implements that interface. Services depend only on the interface.

```
flight/
  flight.repository.ts     ← interface FlightRepository { ... }
  flight.prisma.ts         ← class PrismaFlightRepository implements FlightRepository
  flight.service.ts        ← constructor(private repo: FlightRepository, ...)
```

**Rationale**: Allows unit tests to inject a mock `FlightRepository` (plain object satisfying the interface) without Prisma or a database. Also documents the exact data access contract for each domain.

**Alternative considered**: Skip interfaces, use `jest.mock()` to mock the Prisma module. Rejected because it ties tests to implementation details and doesn't make the contract explicit.

---

### 3. Constructor injection, no DI container

**Decision**: Services receive repositories via constructor. A `container.ts` at the src root creates and exports singleton service instances.

```typescript
// container.ts
const helicopterRepo = new PrismaHelicopterRepository(prisma)
const flightRepo = new PrismaFlightRepository(prisma)

export const helicopterService = new HelicopterService(helicopterRepo)
export const flightService = new FlightService(flightRepo, helicopterRepo)
```

Route files import from `container.ts`.

**Rationale**: Simple, explicit, no library overhead. The graph of dependencies is small and stable. Manual wiring is readable and debuggable without framework magic.

**Alternative considered**: `awilix` or `tsyringe` DI containers. Rejected — adds dependency and complexity disproportionate to the app size.

---

### 4. Domain errors mapped to HTTP at the route layer

**Decision**: Services throw typed domain errors (e.g. `HelicopterNotFoundError`, `DuplicateHelicopterNameError`). Route handlers catch these and map them to HTTP status codes.

```typescript
// helicopter.errors.ts
export class HelicopterNotFoundError extends AppError { ... }

// helicopter.routes.ts
try {
  const result = await helicopterService.getById(id)
  return c.json(result)
} catch (e) {
  if (e instanceof HelicopterNotFoundError) return c.json({ error: e.message }, 404)
  throw e
}
```

A `shared/errors.ts` defines the base `AppError` class.

**Rationale**: Services stay pure (no HTTP knowledge). Error semantics are explicit in the domain. Routes remain the single point responsible for HTTP status decisions.

**Alternative considered**: Return `Result<T, Error>` types instead of throwing. Rejected — more verbose for this codebase size, and TypeScript doesn't enforce unwrapping.

---

### 5. Zod schemas belong to the HTTP layer

**Decision**: Zod validation schemas live in `*.schema.ts` inside each domain module. They are imported only by `*.routes.ts`, not by services.

**Rationale**: Validation of HTTP input is an HTTP concern. Services accept typed domain inputs, not raw request payloads. This keeps services decoupled from Zod.

---

### 6. Cross-domain dependency: Flight → Helicopter

**Decision**: `FlightService` takes both `FlightRepository` and `HelicopterRepository` via constructor. It is responsible for recalculating `helicopter.totalHours` after any flight mutation.

**Rationale**: The `totalHours` recalculation is a natural side effect of flight operations. It's simple enough to handle directly in `FlightService` without domain events or an orchestration layer. This is the only cross-domain write.

## Risks / Trade-offs

**More files, more navigation** → Mitigated by consistent naming convention (`*.types.ts`, `*.service.ts`, etc.) — the structure is predictable.

**`container.ts` becomes a coupling point** → Acceptable for this app size. If it grows, it can be split per domain.

**Shared `HelicopterRepository` between domains** → `FlightService` and `MaintenanceService` both need `HelicopterRepository` for existence checks. Both receive it via constructor from `container.ts` — no shared mutable state, just shared interface.

## Migration Plan

This is a pure refactor — no schema changes, no API changes.

1. Create `shared/` module with base errors and types
2. Migrate one domain at a time: `helicopter` → `flight` → `maintenance` → `stats`
3. For each domain: create types → errors → repository interface → service → Prisma impl → schema → routes
4. Update `container.ts` incrementally as domains are added
5. Update `index.ts` to mount new routes once all domains are migrated
6. Delete old `routes/` directory

At no point does the running app break — old routes can coexist with new ones during migration if needed, though a clean cutover per domain is preferred.

## Open Questions

- None — scope is well-defined and contained.
