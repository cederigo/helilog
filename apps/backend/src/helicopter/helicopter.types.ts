import type { CreateHelicopterInput, UpdateHelicopterInput } from '@helilog/shared'
import type { Flight } from '../flight/flight.types'
import type { MaintenanceRecord } from '../maintenance/maintenance.types'

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

export interface HelicopterDetail extends Helicopter {
  flights: Flight[]
  maintenance: MaintenanceRecord[]
}

export type { CreateHelicopterInput, UpdateHelicopterInput }
