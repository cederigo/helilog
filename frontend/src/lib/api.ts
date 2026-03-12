import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helicopter API
export const helicopterApi = {
  getAll: () => api.get('/helicopters'),
  getById: (id: number) => api.get(`/helicopters/${id}`),
  create: (data: Record<string, unknown>) => api.post('/helicopters', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/helicopters/${id}`, data),
  delete: (id: number) => api.delete(`/helicopters/${id}`),
}

// Flight API
export const flightApi = {
  getAll: (params?: Record<string, string>) => api.get('/flights', { params }),
  getById: (id: number) => api.get(`/flights/${id}`),
  create: (data: Record<string, unknown>) => api.post('/flights', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/flights/${id}`, data),
  delete: (id: number) => api.delete(`/flights/${id}`),
}

// Stats API
export const statsApi = {
  getStats: () => api.get('/stats'),
  getRecent: () => api.get('/stats/recent'),
  getWeeklyTrends: () => api.get('/stats/trends/weekly'),
  getMonthlyTrends: () => api.get('/stats/trends/monthly'),
}

// Maintenance API
export const maintenanceApi = {
  create: (data: Record<string, unknown>) => api.post('/maintenance', data),
  getForHelicopter: (id: number) => api.get(`/maintenance/helicopters/${id}/maintenance`),
  getAlerts: () => api.get('/maintenance/alerts'),
}
