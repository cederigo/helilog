import { FlightRepository } from './flight.repository'
import {
  Flight,
  FlightWithModel,
  CreateFlightInput,
  UpdateFlightInput,
  FlightFilters,
} from './flight.types'
import { FlightNotFoundError } from './flight.errors'
import { ModelRepository } from '../model/model.repository'
import { ModelNotFoundError } from '../model/model.errors'

export class FlightService {
  constructor(
    private readonly flights: FlightRepository,
    private readonly models: ModelRepository,
  ) {}

  async list(
    filters: FlightFilters,
    pagination: { page: number; limit: number },
  ): Promise<{ flights: FlightWithModel[]; total: number; page: number; limit: number }> {
    const { flights, total } = await this.flights.findMany(filters, pagination)
    return { flights, total, page: pagination.page, limit: pagination.limit }
  }

  async getById(id: number): Promise<FlightWithModel> {
    const flight = await this.flights.findById(id)
    if (!flight) throw new FlightNotFoundError(id)
    return flight
  }

  async logFlight(input: CreateFlightInput): Promise<Flight> {
    const model = await this.models.findById(input.modelId)
    if (!model) throw new ModelNotFoundError(input.modelId)

    return this.flights.create(input)
  }

  async updateFlight(id: number, input: UpdateFlightInput): Promise<Flight> {
    const existing = await this.flights.findById(id)
    if (!existing) throw new FlightNotFoundError(id)

    return this.flights.update(id, input)
  }

  async deleteFlight(id: number): Promise<void> {
    const flight = await this.flights.findById(id)
    if (!flight) throw new FlightNotFoundError(id)

    await this.flights.delete(id)
  }

  async getTelemetry(flightId: number) {
    const flight = await this.flights.findById(flightId)
    if (!flight) throw new FlightNotFoundError(flightId)
    return this.flights.findTelemetryByFlightId(flightId)
  }
}
