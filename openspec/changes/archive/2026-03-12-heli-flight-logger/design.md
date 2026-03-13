## Context

This is a greenfield project for a web-based RC helicopter flight logging application. RC helicopter pilots currently lack a dedicated tool for tracking flight sessions, maintenance schedules, and performance metrics. The application will serve individual pilots managing their personal fleet of RC helicopters.

## Goals / Non-Goals

**Goals:**

- Build a responsive web application accessible from desktop and mobile devices
- Provide intuitive flight logging with helicopter-specific metadata
- Enable multi-helicopter tracking with individual flight hour counters
- Offer insights through a dashboard with flight statistics
- Support historical data search and filtering

**Non-Goals:**

- Multi-user collaboration or team features
- Real-time flight telemetry integration
- Mobile native applications (web-responsive only in initial version)
- Cloud synchronization across devices (single-device usage initially)
- Integration with RC flight simulators

## Decisions

### Technology Stack

**Decision**: Use a modern web stack with React frontend, Node hono backend, and SQLite database. Use typescript for type safety across the stack.

**Rationale**:

- React provides component reusability and good mobile responsiveness
- Node hono enables full TypeScript stack for simpler development
- SQLite offers lightweight relational data modeling for flights, helicopters, and relationships
- Tailwind CSS allows rapid styling with utility classes

### Architecture Pattern

**Decision**: Implement a traditional client-server architecture with RESTful API.

**Rationale**:

- Straightforward separation of concerns
- Easy to extend with mobile apps later
- Standard API patterns for CRUD operations
- Alternatives considered: GraphQL (unnecessary complexity for simple CRUD), serverless (higher operational overhead)

### Data Model

**Decision**: Three core entities - Helicopters, Flights, and MaintenanceRecords.

**Rationale**:

- Helicopters: Store heli specs, total flight hours, maintenance schedule
- Flights: Link to specific helicopter, capture flight metadata (date, duration, conditions, notes)
- MaintenanceRecords: Track maintenance actions per helicopter
- Relationship: One helicopter to many flights and maintenance records

### State Management

**Decision**: Use React Context API for application state, local storage for data persistence.

**Rationale**:

- Context API sufficient for single-user app without complex state interactions
- Local storage provides simple persistence without backend auth complexity
- Alternatives considered: Redux (over-engineered for this scale), backend session (requires auth implementation)

## Risks / Trade-offs

**Risk**: Local storage only means data loss if browser data cleared
→ Mitigation: Export/import functionality for backup (future enhancement), clear user guidance on data persistence

**Risk**: No authentication means anyone with device access can view/edit data
→ Mitigation: Acceptable for MVP targeting single-user personal use, can add auth in future version

**Trade-off**: Web-only initially means limited offline capability
→ Mitigation: Progressive Web App (PWA) features can be added later for offline support

**Trade-off**: Single-device usage limits accessibility
→ Mitigation: Export/import feature provides manual data portability
