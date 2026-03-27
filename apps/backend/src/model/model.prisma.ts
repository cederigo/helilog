import { PrismaClient } from '@prisma/client'
import { ModelRepository } from './model.repository'
import { Model, ModelDetail, CreateModelInput, UpdateModelInput } from './model.types'

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

  async create(input: CreateModelInput): Promise<Model> {
    return this.prisma.model.create({ data: input })
  }

  async update(id: number, input: UpdateModelInput): Promise<Model> {
    return this.prisma.model.update({ where: { id }, data: input })
  }

  async delete(id: number): Promise<void> {
    await this.prisma.model.delete({ where: { id } })
  }

  async updateLastMaintenance(id: number, date: Date): Promise<void> {
    await this.prisma.model.update({ where: { id }, data: { lastMaintenance: date } })
  }
}
