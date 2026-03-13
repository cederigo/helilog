export type { DashboardStats, WeeklyTrend, MonthlyTrend } from '@helilog/shared'

// Internal type used only within the stats repository/service for raw query results
export interface FlightSummary {
  duration: number
  date: Date
  helicopterId: number
}
