import { PrismaClient, Prisma } from '@prisma/client'
import { FlightRepository } from './flight.repository'
import {
  Flight,
  FlightWithModel,
  CreateFlightInput,
  UpdateFlightInput,
  FlightFilters,
} from './flight.types'

export class PrismaFlightRepository implements FlightRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: FlightFilters, pagination: { page: number; limit: number }) {
    const where: Prisma.FlightWhereInput = {}

    if (filters.modelId) where.modelId = filters.modelId

    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) (where.date as Prisma.DateTimeFilter).gte = filters.startDate
      if (filters.endDate) (where.date as Prisma.DateTimeFilter).lte = filters.endDate
    }

    const orderBy: Prisma.FlightOrderByWithRelationInput =
      filters.sortBy === 'date' || filters.sortBy === 'duration'
        ? { [filters.sortBy]: filters.sortOrder === 'asc' ? 'asc' : 'desc' }
        : { date: 'desc' }

    const skip = (pagination.page - 1) * pagination.limit

    const [rows, total] = await Promise.all([
      this.prisma.flight.findMany({
        where,
        orderBy,
        skip,
        take: pagination.limit,
        include: { model: { select: { id: true, name: true } } },
      }),
      this.prisma.flight.count({ where }),
    ])

    return { flights: rows, total }
  }

  async findById(id: number): Promise<FlightWithModel | null> {
    return this.prisma.flight.findUnique({
      where: { id },
      include: { model: true },
    })
  }

  async create(input: CreateFlightInput): Promise<Flight> {
    return this.prisma.flight.create({ data: input })
  }

  async update(id: number, input: UpdateFlightInput): Promise<Flight> {
    return this.prisma.flight.update({ where: { id }, data: input })
  }

  async delete(id: number): Promise<void> {
    await this.prisma.flight.delete({ where: { id } })
  }

  async countByModelId(modelId: number): Promise<number> {
    return this.prisma.flight.count({ where: { modelId } })
  }

  async sumDurationByModelId(modelId: number): Promise<number> {
    const result = await this.prisma.flight.aggregate({
      where: { modelId },
      _sum: { duration: true },
    })
    return result._sum.duration ?? 0
  }

  async findRecent(limit: number): Promise<FlightWithModel[]> {
    return this.prisma.flight.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: { model: { select: { id: true, name: true } } },
    })
  }

  async findTelemetryByFlightId(flightId: number) {
    return this.prisma.flightTelemetryPoint.findMany({
      where: { flightId },
      orderBy: { timestamp: 'asc' },
    })
  }
}
