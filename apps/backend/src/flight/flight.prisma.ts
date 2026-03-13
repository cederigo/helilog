import { PrismaClient, Prisma } from '@prisma/client'
import { FlightRepository } from './flight.repository'
import { FlightWithHelicopter, CreateFlightInput, UpdateFlightInput, FlightFilters } from './flight.types'
import { serializeDates } from '../shared/utils'
import { Flight } from '@helilog/shared';

export class PrismaFlightRepository implements FlightRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(
    filters: FlightFilters,
    pagination: { page: number; limit: number },
  ): Promise<{ flights: FlightWithHelicopter[]; total: number }> {
    const where: Prisma.FlightWhereInput = {}

    if (filters.helicopterId) where.helicopterId = filters.helicopterId
    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) (where.date as Prisma.DateTimeFilter).gte = filters.startDate
      if (filters.endDate) (where.date as Prisma.DateTimeFilter).lte = filters.endDate
    }
    if (filters.search) where.notes = { contains: filters.search }
    if (filters.flightMode) where.flightMode = filters.flightMode
    if (filters.weather) where.weather = { contains: filters.weather }

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
        include: { helicopter: { select: { id: true, name: true, model: true } } },
      }),
      this.prisma.flight.count({ where }),
    ])

    return { flights: rows.map(serializeDates), total }
  }

  async findById(id: number): Promise<FlightWithHelicopter | null> {
    const row = await this.prisma.flight.findUnique({
      where: { id },
      include: { helicopter: true },
    })
    return row ? serializeDates(row) : null
  }

  async create(input: CreateFlightInput): Promise<Flight> {
    const row = await this.prisma.flight.create({ data: input })
    return serializeDates(row)
  }

  async update(id: number, input: UpdateFlightInput): Promise<Flight> {
    const row = await this.prisma.flight.update({ where: { id }, data: input })
    return serializeDates(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.flight.delete({ where: { id } })
  }

  async countByHelicopterId(helicopterId: number): Promise<number> {
    return this.prisma.flight.count({ where: { helicopterId } })
  }

  async sumDurationByHelicopterId(helicopterId: number): Promise<number> {
    const result = await this.prisma.flight.aggregate({
      where: { helicopterId },
      _sum: { duration: true },
    })
    return result._sum.duration ?? 0
  }

  async findRecent(limit: number): Promise<FlightWithHelicopter[]> {
    const rows = await this.prisma.flight.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: { helicopter: { select: { id: true, name: true, model: true } } },
    })
    return rows.map(serializeDates)
  }
}
