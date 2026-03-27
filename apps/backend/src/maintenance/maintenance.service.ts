import { MaintenanceRepository } from './maintenance.repository'
import { MaintenanceRecord, CreateMaintenanceInput, MaintenanceAlert } from './maintenance.types'
import { ModelRepository } from '../model/model.repository'
import { ModelNotFoundError } from '../model/model.errors'

export class MaintenanceService {
  constructor(
    private readonly maintenance: MaintenanceRepository,
    private readonly models: ModelRepository,
  ) {}

  async getByModel(modelId: number): Promise<MaintenanceRecord[]> {
    return this.maintenance.findByModelId(modelId)
  }

  async record(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    const model = await this.models.findById(input.modelId)
    if (!model) throw new ModelNotFoundError(input.modelId)

    const record = await this.maintenance.create(input)
    await this.models.updateLastMaintenance(input.modelId, input.date)
    return record
  }

  async getAlerts(): Promise<{ alerts: MaintenanceAlert[] }> {
    const modelList = await this.maintenance.findModelsWithLatestMaintenance()

    const alerts = modelList
      .filter((m) => m.maintenanceInterval && m.maintenanceInterval > 0)
      .map((m) => {
        const totalSeconds = m.flights.reduce((sum, f) => sum + f.duration, 0)
        const totalHours = totalSeconds / 3600
        const lastMaintenanceHours = m.maintenance[0]?.hoursAtMaintenance ?? 0
        const hoursSinceMaintenance = totalHours - lastMaintenanceHours
        const nextDue = lastMaintenanceHours + (m.maintenanceInterval ?? 0)
        const hoursOverdue = totalHours - nextDue

        return {
          model: { id: m.id, name: m.name },
          totalHours: Math.round(totalHours * 100) / 100,
          maintenanceInterval: m.maintenanceInterval!,
          lastMaintenanceHours,
          hoursSinceMaintenance: Math.round(hoursSinceMaintenance * 100) / 100,
          nextDueAt: Math.round(nextDue * 100) / 100,
          hoursOverdue: Math.round(hoursOverdue * 100) / 100,
          status: (hoursOverdue > 0
            ? 'overdue'
            : hoursSinceMaintenance >= (m.maintenanceInterval ?? 0) - 1
              ? 'due_soon'
              : 'ok') as MaintenanceAlert['status'],
        }
      })
      .filter((a) => a.status !== 'ok')
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue)

    return { alerts }
  }
}
