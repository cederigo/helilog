import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import helicopters from './routes/helicopters'
import flights from './routes/flights'
import stats from './routes/stats'
import maintenance from './routes/maintenance'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/', (c) => {
  return c.json({ message: 'Helilog API Server', version: '1.0.0' })
})

// API routes
app.route('/api/helicopters', helicopters)
app.route('/api/flights', flights)
app.route('/api/stats', stats)
app.route('/api/maintenance', maintenance)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
