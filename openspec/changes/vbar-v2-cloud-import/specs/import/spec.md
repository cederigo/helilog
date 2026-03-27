## ADDED Requirements

### Requirement: Import endpoint accepts optional files and a typed options map

The `POST /api/imports` endpoint SHALL accept `files[]` as optional (zero or more files) and an `options` field containing parser-specific key-value pairs. The `options` value SHALL be forwarded as-is to the selected parser's `parse()` method. The endpoint MAY be called with no files when the parser does not require them. The service layer SHALL cast the raw options map to the concrete type defined in `ParserOptionsMap` for the given format before passing it to the parser.

#### Scenario: File-based import (no options)

- **WHEN** a POST to `/api/imports` is made with one or more files and `format=vbar_v2` but no `options`
- **THEN** the system SHALL process the files and return `201` with the created import record

#### Scenario: Credential-based import (no files)

- **WHEN** a POST to `/api/imports` is made with `format=vbar_v2`, no files, and `options` containing `username` and `password`
- **THEN** the system SHALL trigger the cloud download-and-parse flow and return `201` with the created import record

#### Scenario: Missing required options

- **WHEN** a POST to `/api/imports` is made with `format=vbar_v2`, no files, and `options` missing `username` or `password`
- **THEN** the parser SHALL throw and the system SHALL return `400` with a descriptive error message

#### Scenario: Authentication failure

- **WHEN** a POST to `/api/imports` is made with `format=vbar_v2` and invalid credentials in `options`
- **THEN** the system SHALL return `401` with an error message and SHALL NOT create an import record

## REMOVED Requirements

### Requirement: vbar_v1 format supported

**Reason**: Replaced by `vbar_v2` which handles the same ZIP-based export format and adds cloud import capability.
**Migration**: Use `vbar_v2` format instead.
