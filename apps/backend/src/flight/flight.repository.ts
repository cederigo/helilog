import { Flight, FlightWithHelicopter, CreateFlightInput, UpdateFlightInput, FlightFilters } from './flight.types'
import { PaginationParams } from '../shared/types'

export interface FlightRepository {
  findMany(
    filters: FlightFilters,
    pagination: PaginationParams,
  ): Promise<{ flights: FlightWithHelicopter[]; total: number }>
  findById(id: number): Promise<FlightWithHelicopter | null>
  create(input: CreateFlightInput): Promise<Flight>
  update(id: number, input: UpdateFlightInput): Promise<Flight>
  delete(id: number): Promise<void>
  countByHelicopterId(helicopterId: number): Promise<number>
  sumDurationByHelicopterId(helicopterId: number): Promise<number>
  findRecent(limit: number): Promise<FlightWithHelicopter[]>
}
