## Requirements

### Requirement: Each domain defines a repository interface

Each domain module SHALL define a TypeScript `interface` in `<domain>.repository.ts` that describes all data access operations for that domain. Services SHALL depend only on this interface, not on any concrete implementation.

#### Scenario: Service depends on interface, not Prisma

- **WHEN** a service method performs a data access operation
- **THEN** it SHALL call a method on the injected repository interface, with no direct import of Prisma or `db.ts`

#### Scenario: Interface is the sole contract

- **WHEN** a Prisma implementation is replaced with a mock in tests
- **THEN** the mock SHALL satisfy the repository interface and the service SHALL function correctly without any code changes

### Requirement: Prisma implementations satisfy repository interfaces

Each domain module SHALL provide a class in `<domain>.prisma.ts` that implements the domain's repository interface using the Prisma client.

#### Scenario: Prisma class implements the interface

- **WHEN** `PrismaFlightRepository` is defined
- **THEN** it SHALL implement `FlightRepository` and TypeScript SHALL enforce the contract at compile time

#### Scenario: Prisma client is injected into repository

- **WHEN** a Prisma repository is instantiated
- **THEN** it SHALL receive the Prisma client instance via its constructor (not import it directly)

### Requirement: Repository interfaces support unit testing via mock injection

Services SHALL be unit-testable by constructing them with a plain object that satisfies the repository interface, without requiring a database or Prisma client.

#### Scenario: Mock repository in a unit test

- **WHEN** a unit test creates a `FlightService`
- **THEN** it SHALL be able to pass a plain object implementing `FlightRepository` (e.g. with `jest.fn()` methods) in place of the Prisma implementation

#### Scenario: Test does not touch the database

- **WHEN** a service unit test runs
- **THEN** no database connection SHALL be opened and no Prisma queries SHALL be executed
