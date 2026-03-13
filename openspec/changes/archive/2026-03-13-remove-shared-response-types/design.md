## Context

Frontend components today use `useState` + `useEffect` for every data fetch, duplicating loading/error/refetch logic in each file. `api.ts` uses a `hc<AppType>()` Hono RPC client but manually casts every response with `as Type`, discarding the type inference the client already provides.

`serializeDates` at the Prisma repository boundary converts `Date` → ISO string before domain objects reach the route layer. This means `c.json(entity)` receives string-typed dates, so the Hono RPC client correctly infers `string` for date fields — no mismatch.

The Zod schemas (`createHelicopterSchema`, `createFlightSchema`, `createMaintenanceSchema`) are imported in frontend form components for validation and stay in `@helilog/shared`.

## Goals / Non-Goals

**Goals:**

- Remove `as` type assertions from `api.ts`; let Hono RPC client infer response types from `AppType`
- Export derived named type helpers from `api.ts` so components have clean type names to import
- Export query key constants from `api.ts` for use with TanStack Query
- Add TanStack Query; replace `useState`/`useEffect` data fetching in components with `useQuery`/`useMutation`
- Remove redundant response interfaces from `@helilog/shared`

**Non-Goals:**

- Advanced TanStack Query features (infinite queries, optimistic updates, prefetching)
- Changing any backend routes or serialization
- Removing the `packages/shared` package itself
- Replacing the Hono RPC client with plain fetch

## Decisions

### 1. Keep hc<AppType>() — remove the `as` casts

**Decision**: The Hono RPC client stays. Remove the `as Type` assertions so TypeScript infers response types from the backend's `c.json()` calls via `AppType`.

**Rationale**: The client is already set up and correct. The `as` casts were negating its value. Fixing them is the minimal change; there's nothing to replace.

### 2. Derived type helpers via Awaited<ReturnType<...>>

**Decision**: Export type aliases derived from the api functions so components can import clean names:

```ts
// api.ts
export type Helicopter = Awaited<ReturnType<typeof helicopterApi.getAll>>['data'][number]
export type HelicopterDetail = Awaited<ReturnType<typeof helicopterApi.getById>>['data']
// etc.
```

**Rationale**: Components need a type to annotate props, state, and `useQuery` data. Exposing `Awaited<ReturnType<...>>` directly at the call site is verbose. Named aliases exported from `api.ts` are ergonomic and remain accurate because they're derived, not duplicated.

**Alternative considered**: Import types via `hono/client` inference utilities. Rejected — more complex and less stable API surface than simple `ReturnType` extraction.

### 3. Query key constants in api.ts

**Decision**: Co-locate query key factory objects with the fetch functions in `api.ts` (e.g. `helicopterKeys = { all: ['helicopters'] as const, detail: (id: number) => ['helicopters', id] as const }`).

**Rationale**: Single source of truth for cache keys; mutations call `queryClient.invalidateQueries({ queryKey: helicopterKeys.all })` using the same constant as the corresponding `useQuery`.

### 4. Mutation error handling

**Decision**: Components access `mutation.error` from `useMutation`. Existing confirm/alert patterns for delete operations are preserved.

### 5. Keep serializeDates at repository boundary

**Decision**: No change. Dates are `string` in JSON responses; the Hono RPC client infers `string` for date fields; derived types in `api.ts` reflect this automatically.

## Risks / Trade-offs

- **Bundle size** → TanStack Query adds ~13 kB gzipped. Acceptable.
- **QueryClient setup** → One-time change in `main.tsx`.
- **Hono client inference sensitivity** → Type inference requires method-chained route definitions (already enforced by existing spec). No change needed in the backend.
- **Inferred types may include error union branches** → The `{ data: T }` wrapper in each api function isolates this; callers get a clean typed result.

## Migration Plan

1. Add `@tanstack/react-query`; add `QueryClientProvider` in `main.tsx`
2. Remove `as` casts from `api.ts`; export derived type helpers and query key constants
3. Refactor components one at a time with `useQuery`/`useMutation`
4. Delete response interfaces from `packages/shared`
5. Run `pnpm typecheck && pnpm build` — verify zero errors
