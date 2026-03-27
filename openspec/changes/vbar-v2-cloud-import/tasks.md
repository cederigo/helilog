## 1. Dependencies & Cleanup

- [x] 1.1 Add `cheerio` to `apps/backend/package.json` dependencies and run `pnpm install`
- [x] 1.2 Delete `apps/backend/src/import/parsers/vbar_v1.ts` and `vbar_v1.test.ts`

## 2. Update ImportParser Interface and Types

- [x] 2.1 In `apps/backend/src/import/import.types.ts`: add `VbarV2Options { username: string; password: string }`, add `ParserOptionsMap { vbar_v2: VbarV2Options }`, make `ImportParser<TOptions = Record<string, never>>` generic with `parse(rawDataPath: string, options: TOptions): Promise<ParsedImport>`, and add a `Parsers` mapped type
- [x] 2.2 Update `apps/backend/src/import/import.service.ts` to accept `options: Record<string, string>` at the service boundary and cast to `ImportParser<Record<string, string>>` when calling `parse(dir, options)`
- [x] 2.3 Update `POST /api/imports` route in `import.routes.ts` to parse an optional `options` field from the multipart body (as JSON string or `options[key]` fields) and pass it to the service; make `files[]` optional (allow empty)

## 3. vbar_v2 Parser — Cloud Download (inside parse)

- [x] 3.1 Create `apps/backend/src/import/parsers/vbar_v2.ts`; implement `parse(rawDataPath, options)` that first checks if CSV files already exist in `rawDataPath` (skip download for reimport)
- [x] 3.2 Implement login: fetch the vstabi.info login page, use cheerio to extract `form_build_id`, POST `options.username` and `options.password` to obtain a session cookie; throw `AuthError` on failure
- [x] 3.3 Implement flight-list pagination: GET `?action=flightlist&start=N` with the session cookie, use cheerio to extract `flightno` values, repeat until an empty page
- [x] 3.4 Implement per-flight detail fetch: GET `?action=edit_flight&flightno=<id>`, use cheerio to extract the first `<textarea>` (event-log) and second `<textarea>` (telemetry) as raw CSV text; add a 200 ms delay between requests
- [x] 3.5 Write extracted event-log CSV as `F<id>_event.csv` and telemetry CSV (if present) as `F<id>_telemetry.csv` inside `rawDataPath`
- [x] 3.6 Ensure `options.username` and `options.password` are never passed to `console.log`, `console.error`, or any logger

## 4. vbar_v2 Parser — CSV Parse Phase

- [x] 4.1 Parse the event-log CSV (`F<id>_event.csv`) for every flight to extract helicopter name, start timestamp, end timestamp, and compute duration (first-to-last event span, minimum 60 s)
- [x] 4.2 When `F<id>_telemetry.csv` exists, parse it to build `ParsedTelemetryPoint[]` and derive `minVoltage`, `maxCurrent`, `energyWh`; when absent set `telemetry: []` and omit voltage/current metrics
- [x] 4.3 Never skip a flight solely because telemetry is absent; only skip if the event log itself is missing or unparseable
- [x] 4.4 Register only `vbar_v2` (typed as `ImportParser<VbarV2Options>`) in `apps/backend/src/import/parsers/index.ts` using the `Parsers` mapped type (remove `vbar_v1`)

## 5. Backend Route — Error Handling

- [x] 5.1 Catch `AuthError` from the parser in `import.routes.ts` and return `401`; ensure the error message does not contain credentials
- [x] 5.2 Verify no `options` fields appear in any error response body or log statement in the route handler

## 6. Frontend — Credential Import UI

- [x] 6.1 Create or update the import UI component to conditionally render a credential form (username + password[type=password] inputs) when `vbar_v2` is selected
- [x] 6.2 On other format selections, show the existing file-upload control and hide the credential fields
- [x] 6.3 On form submit with `vbar_v2`, POST to `POST /api/imports` with `format=vbar_v2`, `options[username]`, `options[password]`, and optional `description` (no files)
- [x] 6.4 Show a loading/disabled state on the submit button while the request is in-flight
- [x] 6.5 On success, display the number of flights imported and navigate to / refresh the imports list
- [x] 6.6 On error, display a user-friendly message (not the raw error or any credential value)

## 7. Verification

- [x] 7.1 Run `pnpm typecheck` from repo root and fix any TypeScript errors
- [x] 7.2 Run `pnpm lint` and fix any lint errors
- [x] 7.3 Manually test the happy path end-to-end: trigger a vbar_v2 import from the UI with valid vstabi.info credentials, verify flights appear in the flight list
- [x] 7.4 Verify that no password appears in backend logs or in any file under `data/imports/`
