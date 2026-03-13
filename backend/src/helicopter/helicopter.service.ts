import { HelicopterRepository } from './helicopter.repository'
import {
  Helicopter,
  HelicopterDetail,
  CreateHelicopterInput,
  UpdateHelicopterInput,
} from './helicopter.types'
import {
  HelicopterNotFoundError,
  DuplicateHelicopterNameError,
  HelicopterHasFlightsError,
} from './helicopter.errors'
import { FlightRepository } from '../flight/flight.repository'

export class HelicopterService {
  constructor(
    private readonly helicopters: HelicopterRepository,
    private readonly flights: FlightRepository,
  ) {}

  async list(): Promise<Helicopter[]> {
    return this.helicopters.findAll()
  }

  async getById(id: number): Promise<HelicopterDetail> {
    const helicopter = await this.helicopters.findById(id)
    if (!helicopter) throw new HelicopterNotFoundError(id)
    return helicopter
  }

  async create(input: CreateHelicopterInput): Promise<Helicopter> {
    const existing = await this.helicopters.findByName(input.name)
    if (existing) throw new DuplicateHelicopterNameError(input.name)
    return this.helicopters.create(input)
  }

  async update(id: number, input: UpdateHelicopterInput): Promise<Helicopter> {
    if (input.name) {
      const existing = await this.helicopters.findByName(input.name)
      if (existing && existing.id !== id) {
        throw new DuplicateHelicopterNameError(input.name)
      }
    }
    const helicopter = await this.helicopters.findById(id)
    if (!helicopter) throw new HelicopterNotFoundError(id)
    return this.helicopters.update(id, input)
  }

  async delete(id: number): Promise<void> {
    const helicopter = await this.helicopters.findById(id)
    if (!helicopter) throw new HelicopterNotFoundError(id)

    const flightCount = await this.flights.countByHelicopterId(id)
    if (flightCount > 0) throw new HelicopterHasFlightsError(id, flightCount)

    await this.helicopters.delete(id)
  }
}
