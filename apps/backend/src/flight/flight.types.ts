import type {
  CreateFlightInput as SharedCreateFlightInput,
  FlightQueryInput as SharedFlightQueryInput,
} from '@helilog/shared'
import type { Flight } from '@prisma/client'

export type { Flight }
export interface FlightWithHelicopter extends Omit<Flight, 'helicopter'> {
  helicopter: {
    id: number
    name: string
    model: string
  }
}

export type CreateFlightInput = Omit<SharedCreateFlightInput, 'date'> & {
  date: Date
}
export type UpdateFlightInput = Partial<
  Omit<CreateFlightInput, 'helicopterId'> & { helicopterId?: number }
>
export type FlightFilters = Omit<SharedFlightQueryInput, 'startDate' | 'endDate'> & {
  startDate?: Date
  endDate?: Date
}
