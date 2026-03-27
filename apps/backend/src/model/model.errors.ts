import { AppError } from '../shared/errors'

export class ModelNotFoundError extends AppError {
  constructor(id: number) {
    super(`Model with id ${id} not found`)
  }
}

export class DuplicateModelNameError extends AppError {
  constructor(name: string) {
    super(`Model with name "${name}" already exists`)
  }
}

export class ModelHasFlightsError extends AppError {
  readonly flightCount: number

  constructor(id: number, flightCount: number) {
    super(`Cannot delete model ${id}: it has ${flightCount} flight(s)`)
    this.flightCount = flightCount
  }
}
