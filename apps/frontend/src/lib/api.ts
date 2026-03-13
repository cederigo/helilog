import { hc } from 'hono/client'
import type { AppType } from '@helilog/backend'
import type { FlightQueryInput } from '@helilog/shared'

export type { FlightQueryInput }

// VITE_API_URL is the server root (e.g. http://localhost:3000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const client = hc<AppType>(API_BASE_URL)

// Helicopter API
export const helicopterApi = {
  getAll: async () => {
    const res = await client.api.helicopters.$get()
    return res.json()
  },
  getById: async (id: number) => {
    const res = await client.api.helicopters[':id'].$get({ param: { id: String(id) } })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  create: async (data: Parameters<typeof client.api.helicopters.$post>[0]['json']) => {
    const res = await client.api.helicopters.$post({ json: data })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  update: async (id: number, data: Parameters<typeof client.api.helicopters[':id']['$put']>[0]['json']) => {
    const res = await client.api.helicopters[':id'].$put({ param: { id: String(id) }, json: data })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  delete: async (id: number) => {
    const res = await client.api.helicopters[':id'].$delete({ param: { id: String(id) } })
    return res.json()
  },
}

// Flight API
export const flightApi = {
  getAll: async (query: FlightQueryInput) => {
    const res = await client.api.flights.$get({ query })
    return res.json()
  },
  getById: async (id: number) => {
    const res = await client.api.flights[':id'].$get({ param: { id: String(id) } })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  create: async (data: Parameters<typeof client.api.flights.$post>[0]['json']) => {
    const res = await client.api.flights.$post({ json: data })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  update: async (id: number, data: Parameters<typeof client.api.flights[':id']['$put']>[0]['json']) => {
    const res = await client.api.flights[':id'].$put({ param: { id: String(id) }, json: data })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  delete: async (id: number) => {
    const res = await client.api.flights[':id'].$delete({ param: { id: String(id) } })
    return res.json()
  },
}

// Stats API
export const statsApi = {
  getStats: async () => {
    const res = await client.api.stats.$get()
    return res.json()
  },
  getRecent: async () => {
    const res = await client.api.stats.recent.$get()
    return res.json()
  },
  getWeeklyTrends: async () => {
    const res = await client.api.stats.trends.weekly.$get()
    return res.json()
  },
  getMonthlyTrends: async () => {
    const res = await client.api.stats.trends.monthly.$get()
    return res.json()
  },
}

// Maintenance API
export const maintenanceApi = {
  create: async (data: Parameters<typeof client.api.maintenance.$post>[0]['json']) => {
    const res = await client.api.maintenance.$post({ json: data })
    const body = await res.json()
    if ('error' in body) throw new Error(body.error)
    return body
  },
  getForHelicopter: async (id: number) => {
    const res = await client.api.maintenance.helicopters[':id'].maintenance.$get({ param: { id: String(id) } })
    return res.json()
  },
  getAlerts: async () => {
    const res = await client.api.maintenance.alerts.$get()
    return res.json()
  },
}

// Query key factories
export const helicopterKeys = {
  all: ['helicopters'] as const,
  detail: (id: number) => ['helicopters', id] as const,
}

export const flightKeys = {
  all: (params?: FlightQueryInput) => ['flights', params ?? {}] as const,
  detail: (id: number) => ['flights', id] as const,
}

export const statsKeys = {
  overview: ['stats', 'overview'] as const,
  recent: ['stats', 'recent'] as const,
  weeklyTrends: ['stats', 'trends', 'weekly'] as const,
  monthlyTrends: ['stats', 'trends', 'monthly'] as const,
}

export const maintenanceKeys = {
  forHelicopter: (id: number) => ['maintenance', 'helicopter', id] as const,
  alerts: ['maintenance', 'alerts'] as const,
}
