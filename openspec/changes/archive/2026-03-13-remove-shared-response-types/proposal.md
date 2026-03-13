## Why

The `@helilog/shared` package contains response interfaces (`Helicopter`, `Flight`, etc.) that are redundant — `api.ts` already uses a fully typed Hono RPC client (`hc<AppType>()`) but throws away all type inference with manual `as Type` casts. Meanwhile, frontend components manage data fetching state manually with `useState` + `useEffect`, duplicating loading/error/refetch logic everywhere. Fixing both problems: drop the `as` casts so Hono RPC inference works as intended, and introduce TanStack Query so components consume the typed api functions without boilerplate state management.

## What Changes

- Update `apps/frontend/src/lib/api.ts` — remove `as` type assertions; response types are inferred from `hc<AppType>()` via `Awaited<ReturnType<...>>` helpers exported alongside each api object
- Add `@tanstack/react-query` to `apps/frontend`
- Wrap the app in `QueryClientProvider` in `apps/frontend/src/main.tsx`
- Refactor all frontend components to use `useQuery` / `useMutation` instead of manual `useState` + `useEffect` data fetching
- Remove response type interfaces (`Helicopter`, `Flight`, `FlightWithHelicopter`, `HelicopterDetail`, `MaintenanceRecord`, `DashboardStats`, `MaintenanceAlert`, `WeeklyTrend`, `MonthlyTrend`, `Pagination`) from `packages/shared` — they are now inferred from `AppType`
- Keep Zod input validation schemas and input types (`CreateHelicopterInput`, etc.) in `@helilog/shared` — used in both backend validators and frontend forms
- Keep `serializeDates` in the backend — unchanged

## Capabilities

### New Capabilities
- `tanstack-query`: Frontend data fetching uses TanStack Query (`useQuery`/`useMutation`) with automatic caching, loading, and error states

### Modified Capabilities
- `hono-rpc-client`: `as` casts removed from `api.ts`; response types are inferred from `AppType`. Derived type helpers exported for component use.

## Impact

- **`packages/shared`**: Response interfaces removed; Zod schemas and input types remain
- **`apps/frontend/package.json`**: Add `@tanstack/react-query`
- **`apps/frontend/src/main.tsx`**: Wrap app in `QueryClientProvider`
- **`apps/frontend/src/lib/api.ts`**: Remove `as` casts; export derived type helpers and query key constants
- **`apps/frontend/src/components/*.tsx`**: Replace `useState`/`useEffect` data fetching with `useQuery`/`useMutation`; replace `@helilog/shared` response type imports with derived types from `api.ts`
- **`apps/backend/src/*/`**: No changes
- **No API contract changes** — wire format is identical
