import { PrismaClient } from '@prisma/client'
import { ModelRepository } from './model.repository'
import { Model, ModelDetail, CreateModelInput, UpdateModelInput } from './model.types'
import { normalizeModelName } from './model.name'

export class PrismaModelRepository implements ModelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Model[]> {
    return this.prisma.model.findMany({ orderBy: { name: 'asc' } })
  }

  async findById(id: number): Promise<ModelDetail | null> {
    return this.prisma.model.findUnique({
      where: { id },
      include: {
        maintenance: { orderBy: { date: 'desc' } },
      },
    })
  }

  async findByName(name: string): Promise<Model | null> {
    return this.prisma.model.findUnique({ where: { name } })
  }

  async findByNormalizedName(name: string): Promise<Model | null> {
    const key = normalizeModelName(name)
    const all = await this.prisma.model.findMany()
    return all.find((m) => normalizeModelName(m.name) === key) ?? null
  }

  async create(input: CreateModelInput): Promise<Model> {
    return this.prisma.model.create({ data: input })
  }

  async update(id: number, input: UpdateModelInput): Promise<Model> {
    return this.prisma.model.update({ where: { id }, data: input })
  }

  async delete(id: number): Promise<void> {
    await this.prisma.model.delete({ where: { id } })
  }

  async merge(targetId: number, sourceId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.flight.updateMany({ where: { modelId: sourceId }, data: { modelId: targetId } })
      await tx.maintenanceRecord.updateMany({
        where: { modelId: sourceId },
        data: { modelId: targetId },
      })
      await tx.model.delete({ where: { id: sourceId } })
    })
  }

  async updateLastMaintenance(id: number, date: Date): Promise<void> {
    await this.prisma.model.update({ where: { id }, data: { lastMaintenance: date } })
  }
}
