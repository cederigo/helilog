import { PrismaClient } from '@prisma/client'
import { MaintenanceRepository } from './maintenance.repository'
import {
  MaintenanceRecord,
  CreateMaintenanceInput,
  ModelMaintenanceData,
} from './maintenance.types'

export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByModelId(modelId: number): Promise<MaintenanceRecord[]> {
    return this.prisma.maintenanceRecord.findMany({
      where: { modelId },
      orderBy: { date: 'desc' },
    })
  }

  async create(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    return this.prisma.maintenanceRecord.create({
      data: input,
    })
  }

  async findModelsWithLatestMaintenance(): Promise<ModelMaintenanceData[]> {
    return this.prisma.model.findMany({
      include: {
        flights: {
          select: { duration: true },
        },
        maintenance: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { hoursAtMaintenance: true },
        },
      },
    })
  }
}
