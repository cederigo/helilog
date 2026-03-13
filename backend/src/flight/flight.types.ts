import type { CreateFlightInput as SharedCreateFlightInput } from '@helilog/shared'
export type { Flight, FlightWithHelicopter } from '@helilog/shared'

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
