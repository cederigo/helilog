import { AppError } from '../shared/errors'

export class MaintenanceRecordNotFoundError extends AppError {
  constructor(id: number) {
    super(`Maintenance record with id ${id} not found`)
  }
}
