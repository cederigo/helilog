import type { CreateMaintenanceInput as SharedCreateMaintenanceInput } from '@helilog/shared'

export interface MaintenanceRecord {
  id: number
  helicopterId: number
  date: string
  description: string
  hoursAtMaintenance: number
  createdAt: string
  updatedAt: string
}

export interface MaintenanceAlert {
  helicopter: {
    id: number
    name: string
    model: string
  }
  totalHours: number
  maintenanceInterval: number
  lastMaintenanceHours: number
  hoursSinceMaintenance: number
  nextDueAt: number
  hoursOverdue: number
  status: 'overdue' | 'due_soon' | 'ok'
}

export type CreateMaintenanceInput = Omit<SharedCreateMaintenanceInput, 'date'> & { date: Date }

export interface HelicopterMaintenanceData {
  id: number
  name: string
  model: string
  totalHours: number
  maintenanceInterval: number | null
  maintenance: Array<{ hoursAtMaintenance: number }>
}
