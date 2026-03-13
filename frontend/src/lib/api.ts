import axios from 'axios'
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helicopter API
export const helicopterApi = {
  getAll: () => api.get<Helicopter[]>('/helicopters'),
  getById: (id: number) => api.get<HelicopterDetail>(`/helicopters/${id}`),
  create: (data: CreateHelicopterInput) => api.post<Helicopter>('/helicopters', data),
  update: (id: number, data: UpdateHelicopterInput) => api.put<Helicopter>(`/helicopters/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/helicopters/${id}`),
}

// Flight API
export const flightApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<{ flights: FlightWithHelicopter[]; pagination: Pagination }>('/flights', { params }),
  getById: (id: number) => api.get<FlightWithHelicopter>(`/flights/${id}`),
  create: (data: CreateFlightInput) => api.post<Flight>('/flights', data),
  update: (id: number, data: UpdateFlightInput) => api.put<Flight>(`/flights/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/flights/${id}`),
}

// Stats API
export const statsApi = {
  getStats: () => api.get<DashboardStats>('/stats'),
  getRecent: () => api.get<FlightWithHelicopter[]>('/stats/recent'),
  getWeeklyTrends: () => api.get<{ weeks: WeeklyTrend[] }>('/stats/trends/weekly'),
  getMonthlyTrends: () => api.get<{ months: MonthlyTrend[] }>('/stats/trends/monthly'),
}

// Maintenance API
export const maintenanceApi = {
  create: (data: CreateMaintenanceInput) => api.post<MaintenanceRecord>('/maintenance', data),
  getForHelicopter: (id: number) => api.get<MaintenanceRecord[]>(`/maintenance/helicopters/${id}/maintenance`),
  getAlerts: () => api.get<{ alerts: MaintenanceAlert[] }>('/maintenance/alerts'),
}
