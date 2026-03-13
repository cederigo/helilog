import { StatsRepository } from './stats.repository'
import { DashboardStats, WeeklyTrend, MonthlyTrend } from './stats.types'
import { FlightRepository } from '../flight/flight.repository'

export class StatsService {
  constructor(
    private readonly stats: StatsRepository,
    private readonly flights: FlightRepository,
  ) {}

  async getOverallStats(): Promise<DashboardStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const allFlights = await this.stats.getAllFlightSummaries()

    const totalFlights = allFlights.length
    const totalMinutes = allFlights.reduce((sum, f) => sum + f.duration, 0)
    const totalHours = totalMinutes / 60
    const averageDuration = totalFlights > 0 ? totalMinutes / totalFlights : 0
    const flightsThisMonth = allFlights.filter((f) => f.date >= startOfMonth).length

    const flightsByHeli = allFlights.reduce(
      (acc, f) => {
        acc[f.helicopterId] = (acc[f.helicopterId] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    let mostFlownHeliId: number | null = null
    let maxFlights = 0
    for (const [heliId, count] of Object.entries(flightsByHeli)) {
      if (count > maxFlights) {
        maxFlights = count
        mostFlownHeliId = parseInt(heliId)
      }
    }

    let mostFlownHelicopter = null
    if (mostFlownHeliId !== null) {
      const heli = await this.stats.getHelicopterById(mostFlownHeliId)
      if (heli) mostFlownHelicopter = { ...heli, flightCount: maxFlights }
    }

    return {
      totalFlights,
      totalHours: Math.round(totalHours * 100) / 100,
      averageDuration: Math.round(averageDuration),
      flightsThisMonth,
      mostFlownHelicopter,
    }
  }

  async getWeeklyTrends(): Promise<{ weeks: WeeklyTrend[] }> {
    const now = new Date()
    const eightWeeksAgo = new Date(now)
    eightWeeksAgo.setDate(now.getDate() - 56)

    const flights = await this.stats.getFlightDatesInRange(eightWeeksAgo)

    const weeklyData: Record<string, number> = {}
    for (const flight of flights) {
      const flightDate = new Date(flight.date)
      const weekStart = new Date(flightDate)
      weekStart.setDate(flightDate.getDate() - flightDate.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekKey = weekStart.toISOString().split('T')[0]
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1
    }

    const weeks: WeeklyTrend[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7 - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekKey = weekStart.toISOString().split('T')[0]
      weeks.push({ week: weekKey, count: weeklyData[weekKey] || 0 })
    }

    return { weeks }
  }

  async getMonthlyTrends(): Promise<{ months: MonthlyTrend[] }> {
    const now = new Date()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(now.getMonth() - 6)

    const flights = await this.stats.getFlightDurationsInRange(sixMonthsAgo)

    const monthlyData: Record<string, number> = {}
    for (const flight of flights) {
      const flightDate = new Date(flight.date)
      const monthKey = `${flightDate.getFullYear()}-${String(flightDate.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + flight.duration
    }

    const months: MonthlyTrend[] = []
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now)
      month.setMonth(now.getMonth() - i)
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      const totalMinutes = monthlyData[monthKey] || 0
      months.push({ month: monthKey, hours: Math.round((totalMinutes / 60) * 100) / 100 })
    }

    return { months }
  }

  async getRecentFlights() {
    return this.flights.findRecent(5)
  }
}
