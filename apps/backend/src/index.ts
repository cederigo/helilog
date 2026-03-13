import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import helicopters from './helicopter/helicopter.routes'
import flights from './flight/flight.routes'
import stats from './stats/stats.routes'
import maintenance from './maintenance/maintenance.routes'

const app = new Hono()
  .use('*', logger())
  .use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
      ],
      credentials: true,
    }),
  )
  .get('/', (c) => {
    return c.json({ message: 'Helilog API Server', version: '1.0.0' })
  })
  .route('/api/helicopters', helicopters)
  .route('/api/flights', flights)
  .route('/api/stats', stats)
  .route('/api/maintenance', maintenance)

export type AppType = typeof app

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
