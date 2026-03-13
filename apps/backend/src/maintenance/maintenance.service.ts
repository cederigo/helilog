import { MaintenanceRepository } from './maintenance.repository'
import { MaintenanceRecord, CreateMaintenanceInput, MaintenanceAlert } from './maintenance.types'
import { HelicopterRepository } from '../helicopter/helicopter.repository'
import { HelicopterNotFoundError } from '../helicopter/helicopter.errors'

export class MaintenanceService {
  constructor(
    private readonly maintenance: MaintenanceRepository,
    private readonly helicopters: HelicopterRepository,
  ) {}

  async getByHelicopter(helicopterId: number): Promise<MaintenanceRecord[]> {
    return this.maintenance.findByHelicopterId(helicopterId)
  }

  async record(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    const helicopter = await this.helicopters.findById(input.helicopterId)
    if (!helicopter) throw new HelicopterNotFoundError(input.helicopterId)

    const record = await this.maintenance.create(input)
    await this.helicopters.updateLastMaintenance(input.helicopterId, input.date)
    return record
  }

  async getAlerts(): Promise<{ alerts: MaintenanceAlert[] }> {
    const helicopters = await this.maintenance.findHelicoptersWithLatestMaintenance()

    const alerts = helicopters
      .filter((h) => h.maintenanceInterval && h.maintenanceInterval > 0)
      .map((h) => {
        const lastMaintenanceHours = h.maintenance[0]?.hoursAtMaintenance ?? 0
        const hoursSinceMaintenance = h.totalHours - lastMaintenanceHours
        const nextDue = lastMaintenanceHours + (h.maintenanceInterval ?? 0)
        const hoursOverdue = h.totalHours - nextDue

        return {
          helicopter: { id: h.id, name: h.name, model: h.model },
          totalHours: h.totalHours,
          maintenanceInterval: h.maintenanceInterval!,
          lastMaintenanceHours,
          hoursSinceMaintenance: Math.round(hoursSinceMaintenance * 100) / 100,
          nextDueAt: Math.round(nextDue * 100) / 100,
          hoursOverdue: Math.round(hoursOverdue * 100) / 100,
          status: (hoursOverdue > 0
            ? 'overdue'
            : hoursSinceMaintenance >= (h.maintenanceInterval ?? 0) - 1
              ? 'due_soon'
              : 'ok') as MaintenanceAlert['status'],
        }
      })
      .filter((a) => a.status !== 'ok')
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue)

    return { alerts }
  }
}
