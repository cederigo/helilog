## 1. Setup TanStack Query

- [x] 1.1 Add `@tanstack/react-query` to `apps/frontend/package.json` and install (`pnpm install` from repo root)
- [x] 1.2 Create a `QueryClient` instance and wrap the root app in `QueryClientProvider` in `apps/frontend/src/main.tsx`

## 2. Update api.ts

- [x] 2.1 Remove all `as Type` assertions from Hono RPC response calls — let types be inferred from `hc<AppType>()`
- [x] 2.3 Export query key constants (`helicopterKeys`, `flightKeys`, `statsKeys`, `maintenanceKeys`)

## 3. Refactor components to useQuery / useMutation

- [x] 3.1 Refactor `HelicopterList.tsx` — `useQuery` for list fetch, `useMutation` for delete with cache invalidation
- [x] 3.2 Refactor `HelicopterDetail.tsx` — `useQuery` for detail fetch, `useMutation` for delete actions
- [x] 3.3 Refactor `HelicopterForm.tsx` — `useMutation` for create/update; keep `createHelicopterSchema` import from shared
- [x] 3.4 Refactor `FlightList.tsx` — `useQuery` for list fetch, `useMutation` for delete
- [x] 3.5 Refactor `FlightForm.tsx` — `useMutation` for create/update; keep `createFlightSchema` import from shared
- [x] 3.6 Refactor `Dashboard.tsx` — parallel `useQuery` calls for stats, recent flights, alerts, weekly/monthly trends

## 4. Remove component type imports

- [x] 4.1 Remove all `import type { ... } from '@helilog/shared'` for response entity types they can be inferred from useQuery

## 5. Remove response interfaces from shared

- [x] 5.1 Move response entity interfaces from `packages/shared/src/index.ts`: `Helicopter`, `Flight`, `FlightWithHelicopter`, `HelicopterDetail`, `MaintenanceRecord`, `DashboardStats`, `MaintenanceAlert`, `WeeklyTrend`, `MonthlyTrend`, `Pagination` to backend domains
- [x] 5.2 Verify Zod schemas and input types are still exported from shared

## 6. Verify

- [x] 6.1 Run `pnpm typecheck` from repo root — zero errors
- [x] 6.2 Run `pnpm build` from repo root — successful build
- [x] 6.3 Confirm no `@helilog/shared` imports for response entity types remain in any frontend file
