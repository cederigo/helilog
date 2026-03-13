import { FlightRepository } from './flight.repository'
import {
  Flight,
  FlightWithHelicopter,
  CreateFlightInput,
  UpdateFlightInput,
  FlightFilters,
} from './flight.types'
import { FlightNotFoundError } from './flight.errors'
import { HelicopterRepository } from '../helicopter/helicopter.repository'
import { HelicopterNotFoundError } from '../helicopter/helicopter.errors'

export class FlightService {
  constructor(
    private readonly flights: FlightRepository,
    private readonly helicopters: HelicopterRepository,
  ) {}

  async list(
    filters: FlightFilters,
    pagination: { page: number; limit: number },
  ): Promise<{ flights: FlightWithHelicopter[]; total: number; page: number; limit: number }> {
    const { flights, total } = await this.flights.findMany(filters, pagination)
    return { flights, total, page: pagination.page, limit: pagination.limit }
  }

  async getById(id: number): Promise<FlightWithHelicopter> {
    const flight = await this.flights.findById(id)
    if (!flight) throw new FlightNotFoundError(id)
    return flight
  }

  async logFlight(input: CreateFlightInput): Promise<Flight> {
    const helicopter = await this.helicopters.findById(input.helicopterId)
    if (!helicopter) throw new HelicopterNotFoundError(input.helicopterId)

    const flight = await this.flights.create(input)
    await this.recalculateHours(input.helicopterId)
    return flight
  }

  async updateFlight(id: number, input: UpdateFlightInput): Promise<Flight> {
    const existing = await this.flights.findById(id)
    if (!existing) throw new FlightNotFoundError(id)

    const flight = await this.flights.update(id, input)
    await this.recalculateHours(existing.helicopterId)

    if (input.helicopterId && input.helicopterId !== existing.helicopterId) {
      await this.recalculateHours(input.helicopterId)
    }

    return flight
  }

  async deleteFlight(id: number): Promise<void> {
    const flight = await this.flights.findById(id)
    if (!flight) throw new FlightNotFoundError(id)

    await this.flights.delete(id)
    await this.recalculateHours(flight.helicopterId)
  }

  private async recalculateHours(helicopterId: number): Promise<void> {
    const totalMinutes = await this.flights.sumDurationByHelicopterId(helicopterId)
    const totalHours = totalMinutes / 60
    await this.helicopters.updateTotalHours(helicopterId, totalHours)
  }
}
