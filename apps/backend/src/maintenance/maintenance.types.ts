import type { CreateMaintenanceInput as SharedCreateMaintenanceInput } from '@helilog/shared'
export type { MaintenanceRecord, MaintenanceAlert } from '@helilog/shared'

export type CreateMaintenanceInput = Omit<SharedCreateMaintenanceInput, 'date'> & { date: Date }

export interface HelicopterMaintenanceData {
  id: number
  name: string
  model: string
  totalHours: number
  maintenanceInterval: number | null
  maintenance: Array<{ hoursAtMaintenance: number }>
}
