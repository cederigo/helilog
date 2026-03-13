import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { flightService } from '../container'
import { createFlightSchema as baseCreateFlightSchema, updateFlightSchema as baseUpdateFlightSchema } from '@helilog/shared'
import { FlightNotFoundError } from './flight.errors'

const createFlightSchema = baseCreateFlightSchema.extend({
  date: z.iso.datetime().transform(s => new Date(s)),
})
const updateFlightSchema = baseUpdateFlightSchema.extend({
  date: z.iso.datetime().transform(s => new Date(s)).optional(),
})
import { HelicopterNotFoundError } from '../helicopter/helicopter.errors'

const flights = new Hono()

flights.get('/', async (c) => {
  const {
    helicopterId,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    search,
    flightMode,
    weather,
    page = '1',
    limit = '50',
  } = c.req.query()

  const filters = {
    helicopterId: helicopterId ? parseInt(helicopterId) : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    sortBy: sortBy as 'date' | 'duration' | undefined,
    sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    search,
    flightMode,
    weather,
  }

  const pageNum = parseInt(page)
  const pageSize = parseInt(limit)

  const { flights: flightList, total } = await flightService.list(filters, {
    page: pageNum,
    limit: pageSize,
  })

  return c.json({
    flights: flightList,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
})

flights.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const flight = await flightService.getById(id)
    return c.json(flight)
  } catch (e) {
    if (e instanceof FlightNotFoundError) return c.json({ error: e.message }, 404)
    throw e
  }
})

flights.post('/', zValidator('json', createFlightSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const flight = await flightService.logFlight(data)
    return c.json(flight, 201)
  } catch (e) {
    if (e instanceof HelicopterNotFoundError) return c.json({ error: e.message }, 404)
    throw e
  }
})

flights.put('/:id', zValidator('json', updateFlightSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const data = c.req.valid('json')
    const flight = await flightService.updateFlight(id, data)
    return c.json(flight)
  } catch (e) {
    if (e instanceof FlightNotFoundError) return c.json({ error: e.message }, 404)
    throw e
  }
})

flights.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    await flightService.deleteFlight(id)
    return c.json({ message: 'Flight deleted successfully' })
  } catch (e) {
    if (e instanceof FlightNotFoundError) return c.json({ error: e.message }, 404)
    throw e
  }
})

export default flights
