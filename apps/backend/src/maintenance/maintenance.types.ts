import type { CreateMaintenanceInput as SharedCreateMaintenanceInput } from '@helilog/shared'

import type { MaintenanceRecord } from '@prisma/client'

export { MaintenanceRecord }

export interface MaintenanceAlert {
  model: {
    id: number
    name: string
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

export interface ModelMaintenanceData {
  id: number
  name: string
  maintenanceInterval: number | null
  flights: Array<{ duration: number }>
  maintenance: Array<{ hoursAtMaintenance: number }>
}
