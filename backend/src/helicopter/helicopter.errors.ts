import { AppError } from '../shared/errors'

export class HelicopterNotFoundError extends AppError {
  constructor(id: number) {
    super(`Helicopter with id ${id} not found`)
  }
}

export class DuplicateHelicopterNameError extends AppError {
  constructor(name: string) {
    super(`Helicopter with name "${name}" already exists`)
  }
}

export class HelicopterHasFlightsError extends AppError {
  readonly flightCount: number

  constructor(id: number, flightCount: number) {
    super(`Cannot delete helicopter ${id}: it has ${flightCount} flight(s)`)
    this.flightCount = flightCount
  }
}
