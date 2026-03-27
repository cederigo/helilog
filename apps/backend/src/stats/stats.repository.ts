import { FlightSummary } from './stats.types'

export interface StatsRepository {
  getAllFlightSummaries(): Promise<FlightSummary[]>
  getFlightDatesInRange(from: Date): Promise<Array<{ date: Date }>>
  getFlightDurationsInRange(from: Date): Promise<Array<{ date: Date; duration: number }>>
  getModelsByIds(ids: number[]): Promise<Array<{ id: number; name: string }>>
}
