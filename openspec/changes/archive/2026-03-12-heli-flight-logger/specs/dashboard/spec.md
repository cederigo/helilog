## ADDED Requirements

### Requirement: Display Flight Statistics
The system SHALL display aggregate statistics across all flights.

#### Scenario: Show total flight count
- **WHEN** user views dashboard
- **THEN** system displays total number of logged flights

#### Scenario: Show total flight time
- **WHEN** user views dashboard
- **THEN** system displays sum of all flight durations in hours and minutes

#### Scenario: Show average flight duration
- **WHEN** user views dashboard
- **THEN** system calculates and displays average flight duration

#### Scenario: Show flights this month
- **WHEN** user views dashboard
- **THEN** system displays count of flights logged in current calendar month

### Requirement: Display Recent Flights
The system SHALL show recently logged flights on the dashboard.

#### Scenario: Display last 5 flights
- **WHEN** user views dashboard
- **THEN** system displays 5 most recent flights with date, helicopter, and duration

#### Scenario: Navigate to flight from dashboard
- **WHEN** user clicks on a recent flight
- **THEN** system navigates to full flight detail view

#### Scenario: No recent flights
- **WHEN** no flights have been logged
- **THEN** dashboard displays "No recent flights" message

### Requirement: Display Helicopter Fleet Overview
The system SHALL show summary of all helicopters on dashboard.

#### Scenario: Display helicopter count
- **WHEN** user views dashboard
- **THEN** system displays total number of helicopters in fleet

#### Scenario: Display helicopter with most flights
- **WHEN** user views dashboard and flights exist
- **THEN** system displays which helicopter has the most logged flights

#### Scenario: Display most flown helicopter this week
- **WHEN** user views dashboard
- **THEN** system displays helicopter with most flight time in past 7 days

### Requirement: Maintenance Alerts
The system SHALL display maintenance alerts for helicopters requiring attention.

#### Scenario: Display overdue maintenance
- **WHEN** one or more helicopters are overdue for maintenance
- **THEN** dashboard displays alert with helicopter names and hours overdue

#### Scenario: Display upcoming maintenance
- **WHEN** helicopter is within 1 hour of maintenance interval
- **THEN** dashboard displays warning "Maintenance due soon" for that helicopter

#### Scenario: No maintenance alerts
- **WHEN** all helicopters are current on maintenance
- **THEN** dashboard displays "All helicopters up to date" status

#### Scenario: Click maintenance alert
- **WHEN** user clicks on maintenance alert
- **THEN** system navigates to that helicopter's detail page

### Requirement: Flight Trend Visualization
The system SHALL display flight activity trends over time.

#### Scenario: Display flights per week chart
- **WHEN** user views dashboard
- **THEN** system displays bar chart showing number of flights per week for last 8 weeks

#### Scenario: Display flight hours per month chart
- **WHEN** user views dashboard
- **THEN** system displays chart showing total flight hours per month for last 6 months

#### Scenario: Insufficient data for trends
- **WHEN** less than 2 weeks of flight data exists
- **THEN** dashboard displays message "More data needed for trend analysis"

### Requirement: Quick Actions
The system SHALL provide quick access to common actions from dashboard.

#### Scenario: Quick log new flight
- **WHEN** user clicks "Log Flight" button on dashboard
- **THEN** system opens flight logging form

#### Scenario: Quick add helicopter
- **WHEN** user clicks "Add Helicopter" button on dashboard
- **THEN** system opens helicopter creation form

#### Scenario: View all flights shortcut
- **WHEN** user clicks "View All Flights" on dashboard
- **THEN** system navigates to full flight history page
