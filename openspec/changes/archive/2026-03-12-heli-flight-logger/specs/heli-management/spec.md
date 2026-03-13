## ADDED Requirements

### Requirement: Add Helicopter

The system SHALL allow users to add new helicopters to their fleet.

#### Scenario: Add helicopter with basic details

- **WHEN** user enters helicopter name and model
- **THEN** system creates helicopter record with zero initial flight hours

#### Scenario: Add helicopter with full specifications

- **WHEN** user enters name, model, manufacturer, rotor diameter, and weight
- **THEN** system creates helicopter record with all provided specifications

#### Scenario: Prevent duplicate helicopter names

- **WHEN** user attempts to add helicopter with name that already exists
- **THEN** system displays error "Helicopter with this name already exists" and prevents creation

### Requirement: Edit Helicopter Details

The system SHALL allow users to modify helicopter information.

#### Scenario: Edit helicopter specifications

- **WHEN** user modifies helicopter name, model, or specifications
- **THEN** system updates helicopter record with new values

#### Scenario: Update maintenance schedule

- **WHEN** user modifies maintenance interval or next maintenance due date
- **THEN** system updates maintenance scheduling information

### Requirement: Delete Helicopter

The system SHALL allow users to remove helicopters from their fleet.

#### Scenario: Delete helicopter without flights

- **WHEN** user confirms deletion of helicopter with no associated flights
- **THEN** system removes helicopter record

#### Scenario: Prevent deletion of helicopter with flights

- **WHEN** user attempts to delete helicopter with associated flights
- **THEN** system displays warning "Cannot delete helicopter with existing flights" and prevents deletion

#### Scenario: Delete helicopter with flight reassignment

- **WHEN** user confirms deletion and reassigns existing flights to another helicopter
- **THEN** system transfers flights and deletes helicopter record

### Requirement: Track Total Flight Hours

The system SHALL automatically calculate and display total flight hours per helicopter.

#### Scenario: Initialize flight hours

- **WHEN** new helicopter is added
- **THEN** system sets total flight hours to zero

#### Scenario: Update flight hours on new flight

- **WHEN** new flight log is created for helicopter
- **THEN** system adds flight duration to helicopter's total flight hours

#### Scenario: Update flight hours on flight edit

- **WHEN** existing flight duration is modified
- **THEN** system recalculates helicopter's total flight hours

#### Scenario: Update flight hours on flight deletion

- **WHEN** flight log is deleted
- **THEN** system subtracts flight duration from helicopter's total flight hours

### Requirement: Maintenance Scheduling

The system SHALL enable maintenance interval tracking per helicopter.

#### Scenario: Set maintenance interval

- **WHEN** user sets maintenance interval (e.g., "every 10 hours")
- **THEN** system stores interval and calculates next maintenance due based on current flight hours

#### Scenario: Maintenance due alert

- **WHEN** helicopter's flight hours exceed next maintenance due threshold
- **THEN** system marks helicopter as requiring maintenance

#### Scenario: Record maintenance performed

- **WHEN** user marks maintenance as completed
- **THEN** system resets next maintenance due date based on maintenance interval

### Requirement: View Helicopter List

The system SHALL display all helicopters in the user's fleet.

#### Scenario: Display helicopter summary

- **WHEN** user views helicopter list
- **THEN** each entry shows name, model, total flight hours, and maintenance status

#### Scenario: Empty helicopter fleet

- **WHEN** no helicopters have been added
- **THEN** system displays message "No helicopters added yet" with prompt to add first helicopter

#### Scenario: Sort helicopters

- **WHEN** user clicks column header (name, hours, maintenance)
- **THEN** system sorts helicopter list by selected column

### Requirement: Helicopter Detail View

The system SHALL display comprehensive information for a single helicopter.

#### Scenario: View complete specifications

- **WHEN** user opens helicopter detail page
- **THEN** system displays all specifications and flight hour summary

#### Scenario: View recent flights for helicopter

- **WHEN** user views helicopter details
- **THEN** system displays last 10 flights for this helicopter

#### Scenario: View maintenance history

- **WHEN** user views helicopter details
- **THEN** system displays all maintenance records for this helicopter
