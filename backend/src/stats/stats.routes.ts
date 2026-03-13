import { Hono } from 'hono'
import { statsService } from '../container'

const stats = new Hono()

stats.get('/', async (c) => {
  const result = await statsService.getOverallStats()
  return c.json(result)
})

stats.get('/trends/weekly', async (c) => {
  const result = await statsService.getWeeklyTrends()
  return c.json(result)
})

stats.get('/trends/monthly', async (c) => {
  const result = await statsService.getMonthlyTrends()
  return c.json(result)
})

stats.get('/recent', async (c) => {
  const recentFlights = await statsService.getRecentFlights()
  return c.json(recentFlights)
})

export default stats
