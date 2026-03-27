export interface DashboardStats {
  totalFlights: number
  totalHours: number
  averageDuration: number
  flightsThisMonth: number
  topModels: Array<{
    id: number
    name: string
    flightCount: number
  }>
}

export interface WeeklyTrend {
  week: string
  count: number
}

export interface MonthlyTrend {
  month: string
  hours: number
}

// Internal type used only within the stats repository/service for raw query results
export interface FlightSummary {
  duration: number
  date: Date
  modelId: number
}
