import { PrismaClient } from '@prisma/client'
import { MaintenanceRepository } from './maintenance.repository'
import { MaintenanceRecord, CreateMaintenanceInput, HelicopterMaintenanceData } from './maintenance.types'
import { serializeDates } from '../shared/utils'

export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByHelicopterId(helicopterId: number): Promise<MaintenanceRecord[]> {
    const rows = await this.prisma.maintenanceRecord.findMany({
      where: { helicopterId },
      orderBy: { date: 'desc' },
    })
    return rows.map(serializeDates)
  }

  async create(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    const row = await this.prisma.maintenanceRecord.create({
      data: input,
    })
    return serializeDates(row)
  }

  async findHelicoptersWithLatestMaintenance(): Promise<HelicopterMaintenanceData[]> {
    return this.prisma.helicopter.findMany({
      include: {
        maintenance: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { hoursAtMaintenance: true },
        },
      },
    })
  }
}
