import type { QueryClient } from '@tanstack/react-query'

/** Refresh every query that an import can change. */
export function invalidateImportData(queryClient: QueryClient) {
  for (const key of [['imports'], ['flights'], ['models'], ['stats']]) {
    queryClient.invalidateQueries({ queryKey: key })
  }
}
