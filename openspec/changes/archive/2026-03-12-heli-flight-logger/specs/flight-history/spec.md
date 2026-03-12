## ADDED Requirements

### Requirement: View Flight History List
The system SHALL display a list of all logged flights.

#### Scenario: Display all flights in chronological order
- **WHEN** user navigates to flight history
- **THEN** system displays flights sorted by date descending (most recent first)

#### Scenario: Display flight summary information
- **WHEN** flight history list is displayed
- **THEN** each entry shows date, helicopter name, duration, and flight mode

#### Scenario: Empty flight history
- **WHEN** no flights have been logged
- **THEN** system displays message "No flights logged yet" with prompt to create first flight

### Requirement: Search Flights
The system SHALL allow users to search through flight history.

#### Scenario: Search by date range
- **WHEN** user specifies start date and end date
- **THEN** system displays only flights within the specified date range

#### Scenario: Search by helicopter
- **WHEN** user selects a specific helicopter from dropdown
- **THEN** system displays only flights for that helicopter

#### Scenario: Search by text
- **WHEN** user enters text in search box
- **THEN** system displays flights where notes contain the search text (case-insensitive)

### Requirement: Filter Flights
The system SHALL allow users to filter flights by multiple criteria.

#### Scenario: Filter by flight mode
- **WHEN** user selects one or more flight modes (3D, Sport, GPS, Manual)
- **THEN** system displays only flights matching selected modes

#### Scenario: Filter by weather conditions
- **WHEN** user selects weather condition filter (e.g., "windy", "calm")
- **THEN** system displays only flights logged in those conditions

#### Scenario: Combine multiple filters
- **WHEN** user applies helicopter filter AND date range filter
- **THEN** system displays flights matching all active filters (AND logic)

### Requirement: Sort Flight History
The system SHALL allow users to sort flight history by different columns.

#### Scenario: Sort by date
- **WHEN** user clicks date column header
- **THEN** system toggles sort order between ascending and descending

#### Scenario: Sort by duration
- **WHEN** user clicks duration column header
- **THEN** system sorts flights by flight duration in ascending or descending order

#### Scenario: Sort by helicopter
- **WHEN** user clicks helicopter column header
- **THEN** system sorts flights alphabetically by helicopter name

### Requirement: Paginate Flight History
The system SHALL paginate flight history for performance.

#### Scenario: Display flights in pages
- **WHEN** more than 50 flights exist
- **THEN** system displays 50 flights per page with pagination controls

#### Scenario: Navigate between pages
- **WHEN** user clicks next/previous page button
- **THEN** system loads and displays the requested page of flights

#### Scenario: Jump to specific page
- **WHEN** user enters page number and presses enter
- **THEN** system navigates to that page

### Requirement: View Flight Details
The system SHALL allow users to view complete details of a single flight.

#### Scenario: Open flight detail view
- **WHEN** user clicks on a flight in the history list
- **THEN** system displays full flight details including all metadata and notes

#### Scenario: Navigate from detail back to list
- **WHEN** user clicks back button in flight detail view
- **THEN** system returns to flight history list preserving previous filters and page
