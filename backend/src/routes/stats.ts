import { Hono } from 'hono'
import prisma from '../db'

const stats = new Hono()

// GET /api/stats - Overall statistics
stats.get('/', async (c) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Get all flights for calculations
    const allFlights = await prisma.flight.findMany({
      select: { duration: true, date: true, helicopterId: true }
    })
    
    // Total count and hours
    const totalFlights = allFlights.length
    const totalMinutes = allFlights.reduce((sum, f) => sum + f.duration, 0)
    const totalHours = totalMinutes / 60
    
    // Average duration
    const averageDuration = totalFlights > 0 ? totalMinutes / totalFlights : 0
    
    // Flights this month
    const flightsThisMonth = allFlights.filter(f => f.date >= startOfMonth).length
    
    // Helicopter with most flights
    const flightsByHeli = allFlights.reduce((acc, f) => {
      acc[f.helicopterId] = (acc[f.helicopterId] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    let mostFlownHeliId = null
    let maxFlights = 0
    for (const [heliId, count] of Object.entries(flightsByHeli)) {
      if (count > maxFlights) {
        maxFlights = count
        mostFlownHeliId = parseInt(heliId)
      }
    }
    
    let mostFlownHelicopter = null
    if (mostFlownHeliId) {
      mostFlownHelicopter = await prisma.helicopter.findUnique({
        where: { id: mostFlownHeliId },
        select: { id: true, name: true, model: true }
      })
    }
    
    return c.json({
      totalFlights,
      totalHours: Math.round(totalHours * 100) / 100,
      averageDuration: Math.round(averageDuration),
      flightsThisMonth,
      mostFlownHelicopter: mostFlownHelicopter ? {
        ...mostFlownHelicopter,
        flightCount: maxFlights
      } : null
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})

// GET /api/stats/trends/weekly - Weekly flight trends (last 8 weeks)
stats.get('/trends/weekly', async (c) => {
  try {
    const now = new Date()
    const eightWeeksAgo = new Date(now)
    eightWeeksAgo.setDate(now.getDate() - 56) // 8 weeks
    
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: eightWeeksAgo
        }
      },
      select: { date: true },
      orderBy: { date: 'asc' }
    })
    
    // Group by week
    const weeklyData: Record<string, number> = {}
    
    flights.forEach(flight => {
      const flightDate = new Date(flight.date)
      // Get start of week (Sunday)
      const weekStart = new Date(flightDate)
      weekStart.setDate(flightDate.getDate() - flightDate.getDay())
      weekStart.setHours(0, 0, 0, 0)
      
      const weekKey = weekStart.toISOString().split('T')[0]
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1
    })
    
    // Create array of last 8 weeks with counts
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      
      const weekKey = weekStart.toISOString().split('T')[0]
      weeks.push({
        week: weekKey,
        count: weeklyData[weekKey] || 0
      })
    }
    
    return c.json({ weeks })
  } catch (error) {
    return c.json({ error: 'Failed to fetch weekly trends' }, 500)
  }
})

// GET /api/stats/trends/monthly - Monthly flight hours (last 6 months)
stats.get('/trends/monthly', async (c) => {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(now.getMonth() - 6)
    
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: sixMonthsAgo
        }
      },
      select: { date: true, duration: true },
      orderBy: { date: 'asc' }
    })
    
    // Group by month
    const monthlyData: Record<string, number> = {}
    
    flights.forEach(flight => {
      const flightDate = new Date(flight.date)
      const monthKey = `${flightDate.getFullYear()}-${String(flightDate.getMonth() + 1).padStart(2, '0')}`
      
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + flight.duration
    })
    
    // Create array of last 6 months with total hours
    const months = []
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now)
      month.setMonth(now.getMonth() - i)
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      
      const totalMinutes = monthlyData[monthKey] || 0
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100
      
      months.push({
        month: monthKey,
        hours: totalHours
      })
    }
    
    return c.json({ months })
  } catch (error) {
    return c.json({ error: 'Failed to fetch monthly trends' }, 500)
  }
})

// GET /api/flights/recent - Recent flights
stats.get('/recent', async (c) => {
  try {
    const recentFlights = await prisma.flight.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        helicopter: {
          select: { id: true, name: true, model: true }
        }
      }
    })
    
    return c.json(recentFlights)
  } catch (error) {
    return c.json({ error: 'Failed to fetch recent flights' }, 500)
  }
})

export default stats
