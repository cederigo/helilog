import { PrismaClient } from '@prisma/client'
import { HelicopterRepository } from './helicopter.repository'
import {
  Helicopter,
  HelicopterDetail,
  CreateHelicopterInput,
  UpdateHelicopterInput,
} from './helicopter.types'
import { serializeDates } from '../shared/utils'

export class PrismaHelicopterRepository implements HelicopterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Helicopter[]> {
    const rows = await this.prisma.helicopter.findMany({ orderBy: { name: 'asc' } })
    return rows.map(serializeDates)
  }

  async findById(id: number): Promise<HelicopterDetail | null> {
    const row = await this.prisma.helicopter.findUnique({
      where: { id },
      include: {
        flights: { orderBy: { date: 'desc' }, take: 10 },
        maintenance: { orderBy: { date: 'desc' } },
      },
    })
    return row ? serializeDates(row) : null
  }

  async findByName(name: string): Promise<Helicopter | null> {
    const row = await this.prisma.helicopter.findUnique({ where: { name } })
    return row ? serializeDates(row) : null
  }

  async create(input: CreateHelicopterInput): Promise<Helicopter> {
    const row = await this.prisma.helicopter.create({ data: { ...input, totalHours: 0 } })
    return serializeDates(row)
  }

  async update(id: number, input: UpdateHelicopterInput): Promise<Helicopter> {
    const row = await this.prisma.helicopter.update({ where: { id }, data: input })
    return serializeDates(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.helicopter.delete({ where: { id } })
  }

  async updateTotalHours(id: number, totalHours: number): Promise<void> {
    await this.prisma.helicopter.update({ where: { id }, data: { totalHours } })
  }

  async updateLastMaintenance(id: number, date: Date): Promise<void> {
    await this.prisma.helicopter.update({ where: { id }, data: { lastMaintenance: date } })
  }
}
