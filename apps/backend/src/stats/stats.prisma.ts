import { PrismaClient } from '@prisma/client'
import { StatsRepository } from './stats.repository'
import { FlightSummary } from './stats.types'

export class PrismaStatsRepository implements StatsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAllFlightSummaries(): Promise<FlightSummary[]> {
    return this.prisma.flight.findMany({
      select: { duration: true, date: true, modelId: true },
    })
  }

  async getFlightDatesInRange(from: Date): Promise<Array<{ date: Date }>> {
    return this.prisma.flight.findMany({
      where: { date: { gte: from } },
      select: { date: true },
      orderBy: { date: 'asc' },
    })
  }

  async getFlightDurationsInRange(from: Date): Promise<Array<{ date: Date; duration: number }>> {
    return this.prisma.flight.findMany({
      where: { date: { gte: from } },
      select: { date: true, duration: true },
      orderBy: { date: 'asc' },
    })
  }

  async getModelsByIds(ids: number[]): Promise<Array<{ id: number; name: string }>> {
    return this.prisma.model.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })
  }
}
