## ADDED Requirements

### Requirement: Create Flight Log Entry
The system SHALL allow users to create a new flight log entry with all required metadata.

#### Scenario: Create basic flight log
- **WHEN** user fills in date, duration, and selects a helicopter
- **THEN** system creates a flight log entry with timestamp and basic details

#### Scenario: Create flight log with detailed metadata
- **WHEN** user fills in date, duration, helicopter, battery cycles, flight mode, weather conditions, and notes
- **THEN** system creates a flight log entry with all provided metadata

#### Scenario: Create flight log without required fields
- **WHEN** user attempts to save without date, duration, or helicopter selection
- **THEN** system displays validation error and prevents saving

### Requirement: Edit Flight Log Entry
The system SHALL allow users to modify existing flight log entries.

#### Scenario: Edit flight metadata
- **WHEN** user opens an existing flight log and modifies any field
- **THEN** system updates the flight log with new values while preserving original creation timestamp

#### Scenario: Change associated helicopter
- **WHEN** user changes the helicopter selection for an existing flight
- **THEN** system updates both the old and new helicopter's total flight hours accordingly

### Requirement: Delete Flight Log Entry
The system SHALL allow users to delete flight log entries.

#### Scenario: Delete single flight
- **WHEN** user confirms deletion of a flight log entry
- **THEN** system removes the entry and updates associated helicopter's flight hours

#### Scenario: Cancel flight deletion
- **WHEN** user cancels the deletion confirmation dialog
- **THEN** system keeps the flight log entry unchanged

### Requirement: Flight Duration Tracking
The system SHALL automatically calculate and track flight duration.

#### Scenario: Manual duration entry
- **WHEN** user enters flight duration in minutes
- **THEN** system stores duration and adds it to helicopter's total flight hours

#### Scenario: Duration in hours and minutes
- **WHEN** user enters duration in format "HH:MM"
- **THEN** system converts to minutes and stores total duration

### Requirement: Flight Metadata Capture
The system SHALL capture helicopter-specific metadata for each flight.

#### Scenario: Record battery cycles
- **WHEN** user enters number of battery cycles used during flight
- **THEN** system stores battery cycle count with flight log

#### Scenario: Record flight mode
- **WHEN** user selects flight mode from predefined options (3D, Sport, GPS, Manual)
- **THEN** system stores selected flight mode with flight log

#### Scenario: Record weather conditions
- **WHEN** user enters weather conditions (temperature, wind, visibility)
- **THEN** system stores weather data with flight log

#### Scenario: Add flight notes
- **WHEN** user enters free-text notes about the flight
- **THEN** system stores notes with character limit of 1000 characters
