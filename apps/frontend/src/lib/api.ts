import { hc } from 'hono/client'
import type { AppType } from '@helilog/backend'
import type {
  Helicopter,
  HelicopterDetail,
  Flight,
  FlightWithHelicopter,
  MaintenanceRecord,
  DashboardStats,
  MaintenanceAlert,
  WeeklyTrend,
  MonthlyTrend,
  Pagination,
  CreateHelicopterInput,
  UpdateHelicopterInput,
  CreateFlightInput,
  UpdateFlightInput,
  CreateMaintenanceInput,
} from '@helilog/shared'

// VITE_API_URL is the server root (e.g. http://localhost:3000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const client = hc<AppType>(API_BASE_URL)

// Helicopter API
export const helicopterApi = {
  getAll: async () => {
    const res = await client.api.helicopters.$get()
    return { data: (await res.json()) as Helicopter[] }
  },
  getById: async (id: number) => {
    const res = await client.api.helicopters[':id'].$get({ param: { id: String(id) } })
    return { data: (await res.json()) as HelicopterDetail }
  },
  create: async (data: CreateHelicopterInput) => {
    const res = await client.api.helicopters.$post({ json: data })
    return { data: (await res.json()) as Helicopter }
  },
  update: async (id: number, data: UpdateHelicopterInput) => {
    const res = await client.api.helicopters[':id'].$put({ param: { id: String(id) }, json: data })
    return { data: (await res.json()) as Helicopter }
  },
  delete: async (id: number) => {
    const res = await client.api.helicopters[':id'].$delete({ param: { id: String(id) } })
    return { data: (await res.json()) as { message: string } }
  },
}

// Flight API
export const flightApi = {
  getAll: async (params?: Record<string, string>) => {
    const res = await client.api.flights.$get({ query: params ?? {} })
    return { data: (await res.json()) as { flights: FlightWithHelicopter[]; pagination: Pagination } }
  },
  getById: async (id: number) => {
    const res = await client.api.flights[':id'].$get({ param: { id: String(id) } })
    return { data: (await res.json()) as FlightWithHelicopter }
  },
  create: async (data: CreateFlightInput) => {
    const res = await client.api.flights.$post({ json: data })
    return { data: (await res.json()) as Flight }
  },
  update: async (id: number, data: UpdateFlightInput) => {
    const res = await client.api.flights[':id'].$put({ param: { id: String(id) }, json: data })
    return { data: (await res.json()) as Flight }
  },
  delete: async (id: number) => {
    const res = await client.api.flights[':id'].$delete({ param: { id: String(id) } })
    return { data: (await res.json()) as { message: string } }
  },
}

// Stats API
export const statsApi = {
  getStats: async () => {
    const res = await client.api.stats.$get()
    return { data: (await res.json()) as DashboardStats }
  },
  getRecent: async () => {
    const res = await client.api.stats.recent.$get()
    return { data: (await res.json()) as FlightWithHelicopter[] }
  },
  getWeeklyTrends: async () => {
    const res = await client.api.stats.trends.weekly.$get()
    return { data: (await res.json()) as { weeks: WeeklyTrend[] } }
  },
  getMonthlyTrends: async () => {
    const res = await client.api.stats.trends.monthly.$get()
    return { data: (await res.json()) as { months: MonthlyTrend[] } }
  },
}

// Maintenance API
export const maintenanceApi = {
  create: async (data: CreateMaintenanceInput) => {
    const res = await client.api.maintenance.$post({ json: data })
    return { data: (await res.json()) as MaintenanceRecord }
  },
  getForHelicopter: async (id: number) => {
    const res = await client.api.maintenance.helicopters[':id'].maintenance.$get({ param: { id: String(id) } })
    return { data: (await res.json()) as MaintenanceRecord[] }
  },
  getAlerts: async () => {
    const res = await client.api.maintenance.alerts.$get()
    return { data: (await res.json()) as { alerts: MaintenanceAlert[] } }
  },
}
