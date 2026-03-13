import { FlightSummary } from './stats.types'

export interface StatsRepository {
  getAllFlightSummaries(): Promise<FlightSummary[]>
  getFlightDatesInRange(from: Date): Promise<Array<{ date: Date }>>
  getFlightDurationsInRange(from: Date): Promise<Array<{ date: Date; duration: number }>>
  getHelicopterById(id: number): Promise<{ id: number; name: string; model: string } | null>
}
