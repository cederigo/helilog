import type { CreateModelInput, UpdateModelInput } from '@helilog/shared'
import type { MaintenanceRecord } from '../maintenance/maintenance.types'
import type { Model } from '@prisma/client'

export type { Model }
export interface ModelDetail extends Model {
  maintenance: MaintenanceRecord[]
}

export type { CreateModelInput, UpdateModelInput }
