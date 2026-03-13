## ADDED Requirements

### Requirement: TanStack Query provider wraps the app

`apps/frontend` SHALL have `@tanstack/react-query` installed and `apps/frontend/src/main.tsx` SHALL wrap the root component in a `QueryClientProvider` with a `QueryClient` instance.

#### Scenario: App renders without QueryClient error

- **WHEN** any component using `useQuery` or `useMutation` is rendered
- **THEN** it SHALL resolve the nearest `QueryClientProvider` without throwing a missing context error

### Requirement: Data fetching components use useQuery

Frontend components that fetch and display data SHALL use `useQuery` from `@tanstack/react-query` instead of `useState` + `useEffect` combinations. The query function SHALL be the corresponding function from `api.ts`. Components SHALL derive loading, error, and data states from the `useQuery` result.

#### Scenario: Component loading state from useQuery

- **WHEN** a component is mounted and the query has not resolved
- **THEN** it SHALL render a loading indicator using `isPending` or `isLoading` from `useQuery`, not a manually managed `loading` state variable

#### Scenario: Component error state from useQuery

- **WHEN** a query fetch throws an error
- **THEN** the component SHALL render an error state using `error` from `useQuery`, not a manually managed `error` state variable

#### Scenario: Component data typed from api function

- **WHEN** a component destructures `data` from `useQuery({ queryFn: helicopterApi.getAll })`
- **THEN** `data` SHALL be typed as the return type of `helicopterApi.getAll` (resolved) with no manual type annotation needed on the `useQuery` call

### Requirement: Mutations use useMutation

Frontend components that create, update, or delete data SHALL use `useMutation` from `@tanstack/react-query`. On success, mutations SHALL invalidate the relevant query cache keys so dependent queries refetch automatically.

#### Scenario: Cache invalidated after successful mutation

- **WHEN** a mutation (create, update, delete) completes successfully
- **THEN** `queryClient.invalidateQueries` SHALL be called with the relevant query key constant from `api.ts` so the affected list or detail query refetches

#### Scenario: Mutation error accessible without manual catch

- **WHEN** a mutation fails
- **THEN** the component SHALL be able to access the error via `mutation.error` without a manual try/catch block in the submit handler
