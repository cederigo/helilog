import {
  MaintenanceRecord,
  CreateMaintenanceInput,
  ModelMaintenanceData,
} from './maintenance.types'

export interface MaintenanceRepository {
  findByModelId(modelId: number): Promise<MaintenanceRecord[]>
  create(input: CreateMaintenanceInput): Promise<MaintenanceRecord>
  findModelsWithLatestMaintenance(): Promise<ModelMaintenanceData[]>
}
