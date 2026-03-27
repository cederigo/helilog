import type {
  CreateFlightInput as SharedCreateFlightInput,
  FlightQueryInput as SharedFlightQueryInput,
} from '@helilog/shared'
import type { Flight } from '@prisma/client'

export type { Flight }
export interface FlightWithModel extends Omit<Flight, 'model'> {
  model: {
    id: number
    name: string
  }
}

export type CreateFlightInput = Omit<SharedCreateFlightInput, 'date'> & {
  date: Date
}
export type UpdateFlightInput = Partial<Omit<CreateFlightInput, 'modelId'> & { modelId?: number }>
export type FlightFilters = Omit<SharedFlightQueryInput, 'startDate' | 'endDate' | 'modelId'> & {
  startDate?: Date
  endDate?: Date
  modelId?: number
}
