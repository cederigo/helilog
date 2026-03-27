import {
  Flight,
  FlightWithModel,
  CreateFlightInput,
  UpdateFlightInput,
  FlightFilters,
} from './flight.types'
import { PaginationParams } from '../shared/types'
import { FlightTelemetryPoint } from '@prisma/client'

export interface FlightRepository {
  findMany(
    filters: FlightFilters,
    pagination: PaginationParams,
  ): Promise<{ flights: FlightWithModel[]; total: number }>
  findById(id: number): Promise<FlightWithModel | null>
  create(input: CreateFlightInput): Promise<Flight>
  update(id: number, input: UpdateFlightInput): Promise<Flight>
  delete(id: number): Promise<void>
  countByModelId(modelId: number): Promise<number>
  sumDurationByModelId(modelId: number): Promise<number>
  findRecent(limit: number): Promise<FlightWithModel[]>
  findTelemetryByFlightId(flightId: number): Promise<FlightTelemetryPoint[]>
}
