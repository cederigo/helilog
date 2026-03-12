## Why

RC helicopter pilots need a way to track their flights, monitor flight hours, and maintain detailed logs for maintenance planning and performance improvement. Currently, pilots rely on paper logs or generic note-taking apps that lack helicopter-specific features and metadata.

## What Changes

- New web application for logging RC helicopter flights
- Flight log entries with date, time, duration, location, and notes
- Multiple helicopter management with individual flight hour tracking
- Dashboard showing flight statistics and recent activity
- Search and filter capabilities for flight history

## Capabilities

### New Capabilities
- `flight-logging`: Create, edit, and delete flight log entries with helicopter-specific metadata (flight duration, battery cycles, flight mode, conditions)
- `flight-history`: View, search, and filter historical flight logs with sorting and pagination
- `heli-management`: Add, edit, and track multiple RC helicopters with individual flight hour counters and maintenance schedules
- `dashboard`: Display flight statistics, recent flights, and maintenance alerts on a main dashboard

### Modified Capabilities
<!-- No existing capabilities being modified - this is a new application -->

## Impact

- New standalone application
- No impact on existing systems
- Will require database for storing flight logs and helicopter data
- Will require web hosting infrastructure
