import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { flightService } from '../container'
import {
  createFlightSchema as baseCreateFlightSchema,
  updateFlightSchema as baseUpdateFlightSchema,
  flightQuerySchema as baseFlightQuerySchema,
} from '@helilog/shared'
import { FlightNotFoundError } from './flight.errors'
import { HelicopterNotFoundError } from '../helicopter/helicopter.errors'

const createFlightSchema = baseCreateFlightSchema.extend({
  date: z.iso.datetime().transform((s) => new Date(s)),
})
const updateFlightSchema = baseUpdateFlightSchema.extend({
  date: z.iso
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
})
const flightQuerySchema = baseFlightQuerySchema.extend({
  helicopterId: z
    .string()
    .transform((s) => parseInt(s))
    .optional(),
  startDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  endDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  page: z
    .string()
    .optional()
    .transform((s) => (s ? parseInt(s) : 1)),
  limit: z
    .string()
    .optional()
    .transform((s) => (s ? parseInt(s) : 50)),
})

const flights = new Hono()
  .get('/', zValidator('query', flightQuerySchema), async (c) => {
    const { startDate, endDate, sortBy, sortOrder, search, flightMode, weather, page, limit } =
      c.req.valid('query')

    const { flights: flightList, total } = await flightService.list(
      { startDate, endDate, sortBy, sortOrder, search, flightMode, weather },
      { page, limit },
    )

    return c.json({
      flights: flightList,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })
  .get('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const flight = await flightService.getById(id)
      return c.json(flight)
    } catch (e) {
      if (e instanceof FlightNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .post('/', zValidator('json', createFlightSchema), async (c) => {
    try {
      const data = c.req.valid('json')
      const flight = await flightService.logFlight(data)
      return c.json(flight, 201)
    } catch (e) {
      if (e instanceof HelicopterNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .put('/:id', zValidator('json', updateFlightSchema), async (c) => {
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
  .delete('/:id', async (c) => {
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
