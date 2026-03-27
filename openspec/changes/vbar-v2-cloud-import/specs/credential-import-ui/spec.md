## ADDED Requirements

### Requirement: UI presents credential form for vbar_v2 format

The frontend import UI SHALL display a username and password input form when the user selects `vbar_v2` as the import format, instead of the file-upload control used for other formats.

#### Scenario: Format selection shows credential fields

- **WHEN** the user selects `vbar_v2` from the format dropdown
- **THEN** a username field and a password field SHALL be displayed and the file-upload control SHALL be hidden

#### Scenario: Format selection shows file upload for other formats

- **WHEN** the user selects any format other than `vbar_v2`
- **THEN** the file-upload control SHALL be displayed and the credential fields SHALL be hidden

### Requirement: Credentials are submitted over the existing API and never stored client-side

The frontend SHALL send `username` and `password` as `options` fields in the multipart body to `POST /api/imports`. The frontend SHALL NOT store credentials in localStorage, sessionStorage, or any other persistent browser storage.

#### Scenario: Correct API endpoint used

- **WHEN** the user submits the vbar_v2 credential form
- **THEN** a POST request is sent to `POST /api/imports` with `format=vbar_v2`, `options[username]`, `options[password]`, and optional `description` in the form body

#### Scenario: Password field is masked

- **WHEN** the password input is rendered
- **THEN** the input type SHALL be `password` so the value is not visible in plain text

### Requirement: UI provides clear feedback during and after the cloud import

The system SHALL indicate to the user that the import is in progress (network request may take tens of seconds) and show a success or error message upon completion.

#### Scenario: Loading state while import runs

- **WHEN** the credential form is submitted and the request is in-flight
- **THEN** the submit button SHALL be disabled and a loading indicator SHALL be shown

#### Scenario: Success feedback

- **WHEN** the cloud import completes successfully
- **THEN** the UI SHALL display the number of flights imported and navigate to or refresh the imports list

#### Scenario: Error feedback

- **WHEN** the cloud import fails (e.g., bad credentials, network error)
- **THEN** the UI SHALL display a user-friendly error message without exposing the password or raw stack trace
