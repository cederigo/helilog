import { PrismaClient } from '@prisma/client'
import { MaintenanceRepository } from './maintenance.repository'
import { MaintenanceRecord, CreateMaintenanceInput, HelicopterMaintenanceData } from './maintenance.types'

export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByHelicopterId(helicopterId: number): Promise<MaintenanceRecord[]> {
    return this.prisma.maintenanceRecord.findMany({
      where: { helicopterId },
      orderBy: { date: 'desc' },
    })
  }

  async create(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    return this.prisma.maintenanceRecord.create({
      data: input,
    })
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
