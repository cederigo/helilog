import { AppError } from '../shared/errors'

export class FlightNotFoundError extends AppError {
  constructor(id: number) {
    super(`Flight with id ${id} not found`)
  }
}
