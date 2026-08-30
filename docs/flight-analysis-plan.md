# Flight Analysis — Feature Extraction Plan

Status: **planned, not implemented**
Author: design discussion, 2026-08-30

## Goal

Derive a small set of per-flight physical/electrical features from the telemetry
we already store (`FlightTelemetryPoint`), persist them, and surface them in the
UI. The headline feature is a **battery internal-resistance (IR) estimate** per
flight, which doubles as a battery-aging / health signal.

This plan covers **feature extraction and storage only**. Battery
_identification_ (guessing which physical pack was flown) is a possible later
phase and is described at the end as out of scope.

## Why a separate table, not columns on `Flight`

`Flight` already carries parser-time aggregates (`minVoltage`, `maxCurrent`,
`maxPower`, `maxRPM`, `chargeUsed`). Those are trivial min/max/last reductions
computed once at import.

The analysis features are different in kind:

- They come from a regression / heuristic we expect to **tune repeatedly**.
- We want to **recompute every row** when the algorithm changes, without
  touching imported facts.
- Some flights can't produce them (no telemetry, a steady hover with no
  current spread) — they are genuinely optional and independent of the flight
  row's validity.

So: a 1:1 `FlightAnalysis` table with an `algoVersion` column to detect stale
rows.

## Data model

### New Prisma model

```prisma
model FlightAnalysis {
  id               Int      @id @default(autoincrement())
  flightId         Int      @unique
  algoVersion      Int      // bump when extraction formulas change

  cells            Int?     // inferred cell count (restingV / NOMINAL_V_PER_CELL)
  internalOhms     Float?   // whole-pack IR from the SoC-aware regression
  internalOhmsPerCell Float? // internalOhms / cells, for cross-pack comparison
  irCurrentSpread  Float?   // p90 - p10 of current (A) — confidence signal for IR
  irConfidence     String?  // "high" | "low" | "none"

  restingVoltage   Float?   // first pre-load sample voltage (V)
  minVoltsPerCell  Float?   // lowest per-cell voltage under load
  capacityToCutoff Float?   // mAh drawn to reach CUTOFF_V_PER_CELL (null if never reached)
  mahPerMinute     Float?   // chargeUsed / (duration / 60)

  computedAt       DateTime @default(now())

  flight           Flight   @relation(fields: [flightId], references: [id], onDelete: Cascade)
}
```

### `Flight` model change

Add the back-relation only:

```prisma
model Flight {
  // ...existing fields...
  analysis  FlightAnalysis?
}
```

### Migration

```bash
cd apps/backend
pnpm db:migrate -- --name add_flight_analysis
pnpm db:generate
```

No data migration needed — rows are backfilled by the job below.

## Feature extraction algorithm

Live in a **pure module** `apps/backend/src/flight-analysis/extract.ts` with no
Prisma imports, taking `ParsedTelemetryPoint[]` / `FlightTelemetryPoint[]` and
returning a plain `FlightFeatures` object. This keeps it unit-testable with
fixture arrays.

Constants (module-level, named):

```ts
const NOMINAL_V_PER_CELL = 3.85   // for cell-count inference from resting voltage
const CUTOFF_V_PER_CELL = 3.5     // "capacity to cutoff" reference point
const LOAD_CURRENT_MIN_A = 5      // rows below this are treated as idle/unloaded
const MIN_LOAD_ROWS = 30          // need at least this many loaded rows to fit IR
const MIN_CURRENT_SPREAD_A = 15   // p90-p10 current spread required to trust IR
const IR_SANITY_MAX_OHM = 0.2     // whole-pack; reject fits outside (0, this)
```

### 1. Cell count

`restingVoltage` = voltage of the first sample where `current < LOAD_CURRENT_MIN_A`
(fallback: first sample overall). `cells = round(restingVoltage / NOMINAL_V_PER_CELL)`.
Guard against `restingVoltage <= 0`.

### 2. Internal resistance (SoC-aware regression)

Terminal voltage under load: `V = OCV(SoC) - I*R`. OCV falls slowly as charge
drains; `I*R` is the fast throttle-linked sag. We separate them by adding the
cumulative `chargeUsed` (mAh, already logged) as a linear proxy for the OCV
droop:

```
V ≈ a + b·chargeUsed + c·current      →      R = -c
```

- Filter to loaded rows: `current > LOAD_CURRENT_MIN_A && voltage > 0`.
- Bail to `irConfidence = "none"` if `< MIN_LOAD_ROWS` rows.
- Compute current spread `p90 - p10`. If `< MIN_CURRENT_SPREAD_A`, still fit but
  mark `irConfidence = "low"` (poorly conditioned — e.g. steady hover).
- Fit ordinary least squares on `[1, chargeUsed, current]` via normal equations
  (3x3, closed form — no dependency needed).
- `internalOhms = -c`. Reject (null) if outside `(0, IR_SANITY_MAX_OHM)`.
- `internalOhmsPerCell = internalOhms / cells` when `cells` known.
- `irConfidence = "high"` when spread ok and fit passed sanity.

Cross-check option (not stored, useful in tests): pairwise median
`-median{ ΔV/ΔI : |ΔI| ≥ 5A, Δt ≤ 2s }` should land within ~30% of the
regression result on clean data.

### 3. Remaining scalars

- `minVoltsPerCell = min(voltage) / cells` over loaded rows.
- `capacityToCutoff`: `chargeUsed` at the first row where `voltage / cells <=
  CUTOFF_V_PER_CELL`; null if never reached.
- `mahPerMinute = chargeUsed_last / (duration / 60)` — weak style signal, cheap
  to keep.

### Known limitations (document in code comments)

- 1 Hz sampling smooths punch transients → IR estimate is biased slightly low.
  Fine for pack-to-pack comparison, not a bench-meter substitute.
- IR drops 20–30% as the pack warms through a flight; we report the whole-flight
  fit, so expect noise between otherwise-identical flights. Tracking the trend
  over many flights is the reliable read.
- EdgeTX files with no ESC telemetry (fallback flights) have no telemetry rows →
  no analysis row.

## Backend module structure

Mirror the existing domain-module pattern (`flight/`, `stats/`):

```
apps/backend/src/flight-analysis/
  extract.ts            # pure feature extraction (no I/O)
  extract.test.ts       # unit tests with fixture telemetry
  flight-analysis.types.ts
  flight-analysis.repository.ts   # interface
  flight-analysis.prisma.ts       # PrismaFlightAnalysisRepository
  flight-analysis.service.ts      # orchestration: load telemetry, extract, upsert
  flight-analysis.routes.ts       # read + recompute endpoints
```

### Repository interface

```ts
export interface FlightAnalysisRepository {
  findByFlightId(flightId: number): Promise<FlightAnalysis | null>
  upsert(flightId: number, features: FlightFeatures, algoVersion: number): Promise<FlightAnalysis>
  findFlightIdsMissingAnalysis(algoVersion: number): Promise<number[]>
}
```

`findFlightIdsMissingAnalysis` returns flights that have telemetry but no
analysis row at the current `algoVersion` (covers both "never computed" and
"stale after algo bump").

### Service

```ts
class FlightAnalysisService {
  // one flight
  async computeForFlight(flightId: number): Promise<FlightAnalysis | null>
  // batch — used by import hook and backfill
  async computeMissing(): Promise<{ processed: number; skipped: number }>
  async getForFlight(flightId: number): Promise<FlightAnalysis | null>
}
```

`ALGO_VERSION` is a constant in the service module; bump it whenever `extract.ts`
changes in a way that alters outputs.

### Routes (`/api/flight-analysis`)

- `GET /:flightId` → the analysis row (or 404).
- `POST /recompute` → runs `computeMissing()`, returns counts. Admin-ish; fine
  for a single-user app.
- Optionally `POST /recompute/:flightId` to force one.

Also expose the analysis on the existing flight detail response — extend
`FlightRepository.findById` include with `analysis: true` and add it to
`FlightWithModel`, so the frontend flight page gets it in one call.

### Container wiring

```ts
const flightAnalysisRepo = new PrismaFlightAnalysisRepository(prisma)
export const flightAnalysisService = new FlightAnalysisService(
  flightAnalysisRepo,
  flightRepo, // for telemetry loading
)
```

### Import hook

In `import.service.ts`, after `persistParsedImport` (in both `create` and
`reimport`), call `flightAnalysisService.computeMissing()`. Keep it outside the
DB transaction — it's derived data and a failure there must not roll back the
import. Log and swallow errors.

## Shared types

Add to `packages/shared/src/index.ts`:

```ts
export const irConfidenceSchema = z.enum(['high', 'low', 'none'])

export interface FlightAnalysisDTO {
  cells: number | null
  internalOhms: number | null
  internalOhmsPerCell: number | null
  irConfidence: 'high' | 'low' | 'none' | null
  restingVoltage: number | null
  minVoltsPerCell: number | null
  capacityToCutoff: number | null
  mahPerMinute: number | null
  computedAt: string
}
```

## Frontend

Minimum viable surface:

1. **Flight detail page** — a small "Analysis" card next to the telemetry chart:
   IR (mΩ, per cell), min V/cell, capacity to 3.5 V/cell, mAh/min. Show a muted
   "low confidence" badge when `irConfidence !== 'high'`, hide the card entirely
   when there's no analysis row.
2. **IR-over-time** — later: a line of `internalOhmsPerCell` across a model's
   flights in date order. This is the actual value of the feature (aging trend).
   Can piggy-back on `TelemetryChart` styling.

No new frontend routes required for phase 1.

## Testing

- `extract.test.ts` — the bulk of the coverage. Build small synthetic telemetry
  arrays with a known `R`, `OCV(charge)` slope and noise, assert the regression
  recovers `R` within tolerance. Cover: clean punchy flight (high confidence),
  steady hover (low confidence / poor conditioning), no-load file (none),
  too-few-rows (none), IR outside sanity range (null).
- Reuse the existing EdgeTX testdata CSVs (`testdata/edgetx/*.csv`) via the
  parser to get a realistic end-to-end fixture in the service test.
- Follow repo test conventions: `node:test`, assertions inside `it()`, no
  `.only` / `.skip`.

## Rollout steps

1. Prisma model + migration + `db:generate`.
2. `extract.ts` + tests (pure, no wiring) — get the algorithm right first.
3. Repository + prisma impl + service + `ALGO_VERSION`.
4. Container wiring + routes + mount in `index.ts`.
5. Import hook in `import.service.ts`.
6. One-off: hit `POST /api/flight-analysis/recompute` to backfill existing
   flights.
7. Shared DTO + extend flight detail response.
8. Frontend analysis card.
9. `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Out of scope (possible phase 2 — battery identification)

Given the user has **at most 2 packs of identical spec**, auto-identification is
low ROI: a 2-way manual toggle is nearly free, and a wrong guess is worse than
no guess. Feasibility hinges on whether the two packs' IR distributions actually
separate — which the phase-1 `internalOhmsPerCell` data will answer directly.

If pursued later:

- `Flight.batteryId Int?` + `Flight.batterySource String?` (`"manual"` |
  `"predicted"`); only `manual` rows are training data.
- `Battery.irBaselineOhms` / `irBaselineAt`, recomputed rolling from labeled
  flights (weight recent flights — IR drifts up with age).
- Prediction: nearest baseline by `internalOhmsPerCell` with a distance
  threshold → "unsure, please assign". Surface as a one-tap suggestion, never an
  automatic assignment.
- Cheaper alternative to ship first: **alternation heuristic** — predict
  "whichever pack wasn't flown last", with one-tap correction.
