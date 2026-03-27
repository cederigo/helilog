## ADDED Requirements

### Requirement: Parser authenticates against vstabi.info cloud

The system SHALL authenticate against vstabi.info using a username and password supplied at import time. The Drupal form-based login flow SHALL be followed: first fetch the login page to extract the `form_build_id`, then POST credentials with form fields.

#### Scenario: Successful login

- **WHEN** the parser receives valid credentials
- **THEN** the system obtains a session cookie that grants access to the cloud flight list

#### Scenario: Invalid credentials

- **WHEN** the parser receives incorrect credentials
- **THEN** the system SHALL throw an error indicating authentication failure and SHALL NOT proceed with the download

### Requirement: Parser paginates and downloads all cloud flights

The system SHALL paginate through the vstabi.info cloud flight list (`?action=flightlist&start=N`) and collect all flight IDs. For each flight ID, the system SHALL fetch the detail page and extract the event-log and telemetry CSV text from the `<textarea>` elements using cheerio.

#### Scenario: Full pagination

- **WHEN** the cloud flight list spans multiple pages (30 items per page)
- **THEN** all pages SHALL be fetched until an empty page is encountered and all flight IDs collected

#### Scenario: CSV extraction via cheerio

- **WHEN** a flight detail HTML page is fetched
- **THEN** the first `<textarea>` content SHALL be used as the event-log CSV and the second `<textarea>` content as the telemetry CSV

#### Scenario: Missing telemetry textarea

- **WHEN** a flight detail page has only one textarea (no telemetry)
- **THEN** the flight SHALL be imported without telemetry data and no error SHALL be thrown

### Requirement: Parser saves extracted CSV files to the import directory

The system SHALL write the extracted event-log and telemetry CSV text for each flight to the import directory as individual files (e.g., `F<id>_event.csv`, `F<id>_telemetry.csv`) so that the parse phase can process them from disk.

#### Scenario: Files written to import directory

- **WHEN** download phase completes successfully for N flights
- **THEN** N event CSV files exist in the import directory, plus up to N telemetry CSV files for those flights that have telemetry

### Requirement: Event-log CSV is the primary source for flight identity and duration

The system SHALL parse the event-log CSV to determine the flight's helicopter name, start timestamp, end timestamp, and duration. This information SHALL be used for all flights regardless of whether telemetry is present. Duration SHALL be computed as the span from the first event timestamp to the last event timestamp, with a minimum of 60 seconds.

#### Scenario: Duration from event log when telemetry is present

- **WHEN** both event-log and telemetry CSV files exist for a flight
- **THEN** the flight SHALL be imported and its duration MAY be computed from the telemetry span if it yields a more precise result; otherwise the event-log span is used

#### Scenario: Duration from event log when telemetry is absent

- **WHEN** only the event-log CSV file exists for a flight (no telemetry)
- **THEN** the flight SHALL be imported with duration derived from the event-log timestamps and with empty telemetry

#### Scenario: Flight without telemetry has no telemetry points

- **WHEN** a flight is imported with no telemetry CSV
- **THEN** `ParsedFlight.telemetry` SHALL be an empty array and voltage/current metrics SHALL be omitted (undefined)

### Requirement: Credentials are never persisted or logged

The system SHALL NOT write credentials to disk, the database, log files, or any other persistent storage. Credentials SHALL be held in memory only for the duration of the download phase and SHALL NOT appear in any error message or log output.

#### Scenario: Credential isolation

- **WHEN** an import using vbar_v2 is triggered with username and password
- **THEN** no file in `data/imports/` contains the username or password, and no log line contains the password

### Requirement: Parser respects vstabi.info with polite fetch rate

The system SHALL introduce a minimum delay of 200 ms between successive per-flight detail-page fetches to avoid overloading the remote server.

#### Scenario: Delay between fetches

- **WHEN** downloading N flights
- **THEN** there are at least (N-1) × 200 ms of cumulative wait time between individual flight fetches
