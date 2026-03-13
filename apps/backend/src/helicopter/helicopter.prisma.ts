import { PrismaClient } from '@prisma/client'
import { HelicopterRepository } from './helicopter.repository'
import {
  Helicopter,
  HelicopterDetail,
  CreateHelicopterInput,
  UpdateHelicopterInput,
} from './helicopter.types'

export class PrismaHelicopterRepository implements HelicopterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Helicopter[]> {
    return this.prisma.helicopter.findMany({ orderBy: { name: 'asc' } })
  }

  async findById(id: number): Promise<HelicopterDetail | null> {
    return this.prisma.helicopter.findUnique({
      where: { id },
      include: {
        flights: { orderBy: { date: 'desc' }, take: 10 },
        maintenance: { orderBy: { date: 'desc' } },
      },
    })
  }

  async findByName(name: string): Promise<Helicopter | null> {
    return this.prisma.helicopter.findUnique({ where: { name } })
  }

  async create(input: CreateHelicopterInput): Promise<Helicopter> {
    return this.prisma.helicopter.create({ data: { ...input, totalHours: 0 } })
  }

  async update(id: number, input: UpdateHelicopterInput): Promise<Helicopter> {
    return this.prisma.helicopter.update({ where: { id }, data: input })
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
