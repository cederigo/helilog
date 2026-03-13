import type { CreateFlightInput as SharedCreateFlightInput } from '@helilog/shared'

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

export interface FlightWithHelicopter extends Omit<Flight, 'helicopter'> {
  helicopter: {
    id: number
    name: string
    model: string
  }
}

export type CreateFlightInput = Omit<SharedCreateFlightInput, 'date'> & { date: Date }
export type UpdateFlightInput = Partial<Omit<CreateFlightInput, 'helicopterId'> & { helicopterId?: number }>

export interface FlightFilters {
  helicopterId?: number
  startDate?: Date
  endDate?: Date
  sortBy?: 'date' | 'duration'
  sortOrder?: 'asc' | 'desc'
  search?: string
  flightMode?: string
  weather?: string
}
