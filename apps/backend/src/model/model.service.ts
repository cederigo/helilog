import { ModelRepository } from './model.repository'
import { Model, ModelDetail, CreateModelInput, UpdateModelInput } from './model.types'
import { ModelNotFoundError, DuplicateModelNameError, ModelHasFlightsError } from './model.errors'
import { FlightRepository } from '../flight/flight.repository'

export class ModelService {
  constructor(
    private readonly models: ModelRepository,
    private readonly flights: FlightRepository,
  ) {}

  async list(): Promise<Model[]> {
    return this.models.findAll()
  }

  async getById(id: number): Promise<ModelDetail> {
    const model = await this.models.findById(id)
    if (!model) throw new ModelNotFoundError(id)
    return model
  }

  async create(input: CreateModelInput): Promise<Model> {
    const existing = await this.models.findByName(input.name)
    if (existing) throw new DuplicateModelNameError(input.name)
    return this.models.create(input)
  }

  async update(id: number, input: UpdateModelInput): Promise<Model> {
    if (input.name) {
      const existing = await this.models.findByName(input.name)
      if (existing && existing.id !== id) {
        throw new DuplicateModelNameError(input.name)
      }
    }
    const model = await this.models.findById(id)
    if (!model) throw new ModelNotFoundError(id)
    return this.models.update(id, input)
  }

  async delete(id: number): Promise<void> {
    const model = await this.models.findById(id)
    if (!model) throw new ModelNotFoundError(id)

    const flightCount = await this.flights.countByModelId(id)
    if (flightCount > 0) throw new ModelHasFlightsError(id, flightCount)

    await this.models.delete(id)
  }
}
