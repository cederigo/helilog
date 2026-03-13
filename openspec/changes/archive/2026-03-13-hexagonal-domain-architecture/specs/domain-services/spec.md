## ADDED Requirements

### Requirement: Services own all business logic

Each domain's service class SHALL contain all business logic for that domain. Route handlers SHALL contain no business logic — only HTTP input parsing, service invocation, error mapping, and response formatting.

#### Scenario: Route handler is a thin adapter

- **WHEN** a route handler processes a request
- **THEN** it SHALL parse HTTP inputs, call one or more service methods, map any domain errors to HTTP responses, and return the result — with no conditional domain logic of its own

#### Scenario: Business logic is not duplicated in routes

- **WHEN** a business rule applies to an operation (e.g. duplicate name check)
- **THEN** that rule SHALL be enforced in the service, not in the route handler

### Requirement: FlightService recalculates helicopter total hours

After any flight is created, updated, or deleted, `FlightService` SHALL recalculate and persist the `totalHours` value on the associated `Helicopter` record(s).

#### Scenario: Total hours updated on flight creation

- **WHEN** a new flight is logged for a helicopter
- **THEN** `helicopter.totalHours` SHALL be updated to reflect the sum of all flight durations divided by 60

#### Scenario: Total hours updated on flight deletion

- **WHEN** a flight is deleted
- **THEN** `helicopter.totalHours` for the associated helicopter SHALL be recalculated

#### Scenario: Total hours updated on helicopter change

- **WHEN** a flight is updated and the `helicopterId` changes
- **THEN** `totalHours` SHALL be recalculated for both the old and new helicopter

### Requirement: HelicopterService enforces name uniqueness

`HelicopterService` SHALL prevent creating or renaming a helicopter to a name that already exists.

#### Scenario: Duplicate name on create

- **WHEN** a helicopter is created with a name that already exists
- **THEN** `HelicopterService` SHALL throw a `DuplicateHelicopterNameError`

#### Scenario: Duplicate name on update

- **WHEN** a helicopter is renamed to a name already used by a different helicopter
- **THEN** `HelicopterService` SHALL throw a `DuplicateHelicopterNameError`

#### Scenario: Same name on same record is allowed

- **WHEN** a helicopter is updated with the same name it already has
- **THEN** `HelicopterService` SHALL not throw an error

### Requirement: HelicopterService guards deletion when flights exist

`HelicopterService` SHALL prevent deleting a helicopter that has associated flight records.

#### Scenario: Delete blocked when flights exist

- **WHEN** a delete is requested for a helicopter that has one or more flights
- **THEN** `HelicopterService` SHALL throw a `HelicopterHasFlightsError`

#### Scenario: Delete succeeds when no flights exist

- **WHEN** a delete is requested for a helicopter with no flights
- **THEN** `HelicopterService` SHALL delete the helicopter successfully

### Requirement: Domain errors are typed and mapped to HTTP at the route layer

Each domain SHALL define typed error classes extending `AppError`. Route handlers SHALL catch these errors and map them to appropriate HTTP status codes.

#### Scenario: NotFound error maps to 404

- **WHEN** a service throws a `*NotFoundError`
- **THEN** the route handler SHALL return an HTTP 404 response with an error message

#### Scenario: Conflict error maps to 400

- **WHEN** a service throws a `DuplicateHelicopterNameError` or `HelicopterHasFlightsError`
- **THEN** the route handler SHALL return an HTTP 400 response with an error message

#### Scenario: Unexpected errors are re-thrown

- **WHEN** a service throws an error that is not a known domain error
- **THEN** the route handler SHALL re-throw it (or let it propagate to the framework error handler)

### Requirement: StatsService owns aggregation logic

`StatsService` SHALL contain all aggregation and computation logic for statistics endpoints (overall stats, weekly trends, monthly trends, recent flights). The stats route handlers SHALL delegate entirely to `StatsService`.

#### Scenario: Weekly grouping logic is in the service

- **WHEN** the weekly trends endpoint is called
- **THEN** the date grouping and week-boundary calculation logic SHALL reside in `StatsService`, not in the route handler
