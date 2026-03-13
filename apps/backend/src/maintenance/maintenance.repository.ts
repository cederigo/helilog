import {
  MaintenanceRecord,
  CreateMaintenanceInput,
  HelicopterMaintenanceData,
} from './maintenance.types'

export interface MaintenanceRepository {
  findByHelicopterId(helicopterId: number): Promise<MaintenanceRecord[]>
  create(input: CreateMaintenanceInput): Promise<MaintenanceRecord>
  findHelicoptersWithLatestMaintenance(): Promise<HelicopterMaintenanceData[]>
}
