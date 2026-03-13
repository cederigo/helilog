export interface DashboardStats {
  totalFlights: number
  totalHours: number
  averageDuration: number
  flightsThisMonth: number
  mostFlownHelicopter: {
    id: number
    name: string
    model: string
    flightCount: number
  } | null
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
  helicopterId: number
}
