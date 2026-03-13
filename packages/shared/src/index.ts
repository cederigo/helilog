import { z } from 'zod'

export interface Helicopter {
  id: number
  name: string
  model: string
  manufacturer?: string | null
  rotorDiameter?: number | null
  weight?: number | null
  totalHours: number
  maintenanceInterval?: number | null
  lastMaintenance?: string | null
  createdAt: string
  updatedAt: string
}

export interface Flight {
  id: number
  helicopterId: number
  date: string
  duration: number
  batteryCycles?: number | null
  flightMode?: string | null
  weather?: string | null
  temperature?: number | null
  windSpeed?: number | null
  notes?: string | null
  location?: string | null
  createdAt: string
  updatedAt: string
  helicopter?: {
    id: number
    name: string
    model: string
  }
}

export interface MaintenanceRecord {
  id: number
  helicopterId: number
  date: string
  description: string
  hoursAtMaintenance: number
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalFlights: number
  totalHours: number
  averageDuration: number
  flightsThisMonth: number
  mostFlownHelicopter: {
    id: number
    name: string
    model: string
    flightCount: number
  } | null
}

export interface MaintenanceAlert {
  helicopter: {
    id: number
    name: string
    model: string
  }
  totalHours: number
  maintenanceInterval: number
  lastMaintenanceHours: number
  hoursSinceMaintenance: number
  nextDueAt: number
  hoursOverdue: number
  status: 'overdue' | 'due_soon' | 'ok'
}

export interface WeeklyTrend {
  week: string
  count: number
}

export interface MonthlyTrend {
  month: string
  hours: number
}

export interface FlightWithHelicopter extends Omit<Flight, 'helicopter'> {
  helicopter: {
    id: number
    name: string
    model: string
  }
}

export interface HelicopterDetail extends Helicopter {
  flights: Flight[]
  maintenance: MaintenanceRecord[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const createHelicopterSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  manufacturer: z.string().optional(),
  rotorDiameter: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  maintenanceInterval: z.number().positive().optional(),
})

export const updateHelicopterSchema = createHelicopterSchema.partial()

export const createFlightSchema = z.object({
  helicopterId: z.number().int().positive(),
  date: z.iso.datetime(),
  duration: z.number().int().positive(),
  batteryCycles: z.number().int().positive().optional(),
  flightMode: z.enum(['3D', 'Sport', 'GPS', 'Manual']).optional(),
  weather: z.string().optional(),
  temperature: z.number().optional(),
  windSpeed: z.number().optional(),
  notes: z.string().max(1000).optional(),
  location: z.string().optional(),
})

export const updateFlightSchema = createFlightSchema.partial()

export const createMaintenanceSchema = z.object({
  helicopterId: z.number().int().positive(),
  date: z.iso.datetime(),
  description: z.string().min(1),
  hoursAtMaintenance: z.number().positive(),
})

export type CreateHelicopterInput = z.infer<typeof createHelicopterSchema>
export type UpdateHelicopterInput = z.infer<typeof updateHelicopterSchema>
export type CreateFlightInput = z.infer<typeof createFlightSchema>
export type UpdateFlightInput = z.infer<typeof updateFlightSchema>
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
