export interface Helicopter {
  id: number
  name: string
  model: string
  manufacturer?: string
  rotorDiameter?: number
  weight?: number
  totalHours: number
  maintenanceInterval?: number
  lastMaintenance?: string
  createdAt: string
  updatedAt: string
}

export interface Flight {
  id: number
  helicopterId: number
  date: string
  duration: number
  batteryCycles?: number
  flightMode?: '3D' | 'Sport' | 'GPS' | 'Manual'
  weather?: string
  temperature?: number
  windSpeed?: number
  notes?: string
  location?: string
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
