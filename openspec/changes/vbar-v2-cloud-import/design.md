## Context

HeliLog has an import pipeline that reads raw data from disk, parses it, and persists flights via `import.service`. The VBar cloud at vstabi.info stores event-log and telemetry data inside per-flight HTML pages behind an authenticated Drupal session. The prototype shell script (`vstabi-cloud-extract.sh`) demonstrates the full scraping flow: form-based login, paginated flight-list, per-flight detail-page fetch, and textarea extraction.

This change replaces `vbar_v1` with `vbar_v2` and extends the import pipeline to support parsers that need arbitrary options (like credentials) rather than uploaded files.

Updated types in `import.types.ts`:

```ts
// Per-parser options types
export interface VbarV2Options {
  username: string
  password: string
}

// Map format name → its options type
export interface ParserOptionsMap {
  vbar_v2: VbarV2Options
}

// Generic parser interface
export interface ImportParser<TOptions = Record<string, never>> {
  parse(rawDataPath: string, options: TOptions): Promise<ParsedImport>
}

// Parsers registry is a mapped type keyed on ParserOptionsMap
export type Parsers = { [K in keyof ParserOptionsMap]: ImportParser<ParserOptionsMap[K]> }
```

The service layer calls `(parsers[format] as ImportParser<Record<string, string>>).parse(dir, options)` at the runtime boundary where format is an unvalidated string; inside each parser the options are the concrete typed form.

Credentials are passed via `options` and held in memory only for the duration of the `parse()` call.

## Goals / Non-Goals

**Goals:**

- Replace `vbar_v1` with `vbar_v2`
- Extend `ImportParser.parse()` to accept a generic `options` map
- Authenticate against vstabi.info using credentials from `options`; use `cheerio` for all HTML scraping (login page, flight list, flight detail pages)
- Paginate the cloud flight list and download all per-flight HTML pages; extract event-log and telemetry CSV text from `<textarea>` elements via cheerio; write those CSV files to the import directory; parse them into `ParsedImport` using standard CSV parsing
- Use the event-log CSV as the primary source for minimal flight data (helicopter name, start/end timestamps, duration) when telemetry is absent; telemetry CSV supplements with richer metrics when present
- Use a concrete per-parser `TOptions` type derived from `ParserOptionsMap`; the route/service accept a string-keyed map at the HTTP boundary and cast safely at the parser call site
- Extend the existing `POST /api/imports` endpoint so `files` are optional and an `options` map is forwarded to the parser
- Update the frontend import UI to present a credential form when `vbar_v2` is selected, submitting credentials as `options`
- Ensure credentials are never logged, stored, or included in any persisted record

**Non-Goals:**

- Incremental / delta sync (only full re-import; existing upsert logic handles duplicates)
- OAuth or token-based auth (the site uses Drupal form login only)
- Storing raw HTML pages at any point
- Proxying the vstabi.info session to the browser

## Decisions

### D1: Credentials passed via `options` into `parse()`

**Decision**: Extend `ImportParser.parse(rawDataPath, options)` with a generic `TOptions` parameter typed via `ParserOptionsMap`. `vbar_v2.parse()` receives `VbarV2Options` (typed `username` + `password`), performs the download phase internally, writes CSV files to `rawDataPath`, then parses them — all within one function call. Credentials are in scope only for the duration of this call.

**Rationale**: Keeps the interface uniform across all parsers (no special-cased download step in the service layer). For `reimport`, the service re-calls `parse()` with empty options; `vbar_v2` detects existing CSV files in `rawDataPath` and skips the download, re-parsing from disk only.

**Alternative considered**: A separate `download()` method on the parser. Rejected because it complicates the service layer and requires the endpoint to know about parser internals.

### D2: Typed options per parser via `ParserOptionsMap`

**Decision**: Introduce `ParserOptionsMap` in `import.types.ts` mapping each format key to its concrete options interface (e.g., `vbar_v2 → VbarV2Options`). `ImportParser` becomes generic: `ImportParser<TOptions>`. The parsers registry is typed as `{ [K in keyof ParserOptionsMap]: ImportParser<ParserOptionsMap[K]> }`. At the HTTP boundary the service receives raw form values and casts them to the appropriate options type after validating the format key.

**Rationale**: Eliminates `Record<string, string>` unsafe widening inside parsers and makes each parser's required inputs self-documenting. TypeScript will catch missing or misspelled option keys at compile time. Adding a new parser just requires adding an entry to `ParserOptionsMap`.

**Alternative considered**: Keeping `Record<string, string>` everywhere and doing runtime validation inside each parser. Rejected because it pushes type errors to runtime and duplicates validation logic.

### D3: Event-log CSV as primary source; telemetry CSV optional

**Decision**: The event-log CSV (first `<textarea>`) is always the authoritative source for a flight's identity: helicopter name, start timestamp, and end timestamp (hence duration). The telemetry CSV (second `<textarea>`), when present, adds richer metrics (voltage, current, headspeed, temperature, per-point telemetry). When telemetry is absent the flight is still imported with duration derived from the event-log timestamps.

**Rationale**: The `vbar_v1` parser required telemetry to be present (it skipped sessions with no telemetry). For cloud data, users may have flights without telemetry recording enabled. Dropping those flights would silently lose data. The event log always contains at least motor-on/motor-off events from which a reliable duration can be computed.

**Alternative considered**: Skip flights with no telemetry (existing `vbar_v1` behaviour). Rejected because cloud users expect all their logged flights to be imported.

### D4: Use `cheerio` for HTML scraping only

**Decision**: Use `cheerio` (server-side jQuery-like HTML parser) for all HTML parsing: extracting `form_build_id` from the login page, extracting `flightno` values from the flight-list pages, and extracting `<textarea>` contents from flight detail pages. Once the CSV text is extracted from HTML, it is written to disk and parsed with normal CSV logic — `cheerio` is not involved in CSV parsing.

**Rationale**: The prototype uses fragile Python regex. `cheerio` gives robust DOM querying and handles malformed HTML gracefully. Keeping CSV parsing separate from HTML scraping maintains a clean separation of concerns.

**Alternative considered**: `node-html-parser` (lighter). `cheerio` preferred for its CSS selector API and wider adoption.

### D5: Single unified `POST /api/imports` endpoint with optional files and options

**Decision**: Extend the existing `POST /api/imports` multipart endpoint: `files[]` becomes optional (may be absent), and an `options` JSON field (or `options[key]` form fields) is added and forwarded as-is to the parser. No new endpoint is created.

**Rationale**: A single endpoint keeps the API surface small and the frontend client simple. Parsers that need files receive them; parsers that need credentials receive them via `options`; both use the same route.

**Alternative considered**: A separate `POST /api/imports/vbar-v2-cloud` endpoint. Rejected because it duplicates import-lifecycle logic and requires format-specific knowledge in the router.

### D6: Import directory scoped to the import record

**Decision**: `vbar_v2.parse()` writes extracted CSV files directly to `rawDataPath` (`data/imports/<id>/`). HTML is never written to disk — only the CSV payloads are saved.

**Rationale**: Reuses the existing `rawDataPath` convention so `reimport` works: re-calling `parse()` with empty options finds existing CSVs in the directory and re-parses them without re-fetching.

### D7: Cookie jar kept in memory

**Decision**: The HTTP session cookie is held in-memory as a string variable during the download phase and discarded when `parse()` returns.

**Rationale**: Writing cookies to disk risks accidental exposure. An in-memory approach is simpler and safer.

## Risks / Trade-offs

- **vstabi.info HTML structure changes** → Mitigation: cheerio selectors target `textarea` by position (index 0 = event-log, index 1 = telemetry); fail with a descriptive error rather than silently dropping data.
- **Rate limiting / IP bans** → Mitigation: Add a 200 ms delay between successive per-flight fetches.
- **Long-running request** → Mitigation: Endpoint is async; for large accounts import may take tens of seconds. Document this; progress feedback is a future concern.
- **Credential exposure via logs** → Mitigation: Never pass `options.username`/`options.password` to any logger. The route handler must not echo options in error responses.
- **`reimport` without credentials** → Mitigation: `vbar_v2.parse()` checks whether CSV files already exist in `rawDataPath`; if so, it skips the download phase and re-parses from disk.

## Open Questions

- Should the endpoint return a stream / SSE for progress feedback, or a simple JSON response once complete? (Decision deferred; JSON response for now.)
- Does vstabi.info require a specific `User-Agent` header? (The prototype did not set one; test during implementation.)
