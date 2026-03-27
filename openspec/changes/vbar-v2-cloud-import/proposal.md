## Why

Users who fly with VBar controllers can log their flights to the vstabi.info cloud platform. Adding a cloud-based importer removes the manual export step and lets users sync their flight data directly from the vstabi.info website using their credentials.

## What Changes

- **BREAKING**: `vbar_v1` parser is removed; replaced by `vbar_v2`
- New `vbar_v2` import parser that authenticates against vstabi.info, scrapes per-flight HTML pages with `cheerio`, extracts the embedded CSV data, and feeds it through the existing CSV parsing and persistence pipeline
- The existing `POST /api/imports` endpoint is extended: `files` become optional and a new `options` field (parser-specific key-value pairs) is added; for `vbar_v2`, `options.username` and `options.password` are passed instead of files
- The `ImportParser` interface gains an `options` parameter so each parser can receive what it needs without changing the endpoint shape
- The frontend import UI gains a `vbar_v2` option that presents a credential form instead of a file-upload control
- `cheerio` added as a backend dependency for HTML scraping

## Capabilities

### New Capabilities

- `vbar-cloud-importer`: Authenticate against vstabi.info using cheerio-based HTML scraping, paginate the cloud flight list, download per-flight HTML pages, extract event-log and telemetry CSV text from `<textarea>` elements (cheerio for HTML only; CSV text is then parsed normally), write CSVs to the import directory, and parse them into `ParsedImport`
- `credential-import-ui`: Frontend UI flow for imports that require credentials (username/password) instead of file uploads; credentials are sent once over HTTPS as parser options and are never persisted

### Modified Capabilities

- `import`: Extended to support optional files and a generic `options` map passed directly to the parser; `vbar_v1` removed; `vbar_v2` added

## Impact

- **Backend**: New file `apps/backend/src/import/parsers/vbar_v2.ts`; updated `ImportParser` interface (add `options` param); updated `apps/backend/src/import/parsers/index.ts` (remove `vbar_v1`, add `vbar_v2`); updated `POST /api/imports` route and service to accept optional files + options; new `cheerio` npm dependency
- **Frontend**: Updated import UI component to conditionally render credential fields when `vbar_v2` is selected; submits credentials via `options` in the existing import endpoint
- **Security**: Credentials must never be logged (no `console.log`, no request logging of body) and must not be written to disk or stored in the database
- **No schema changes**: Parsed output conforms to the existing `ParsedImport` interface
