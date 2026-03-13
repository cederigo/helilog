import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { helicopterService } from '../container'
import { createHelicopterSchema, updateHelicopterSchema } from '@helilog/shared'
import {
  HelicopterNotFoundError,
  DuplicateHelicopterNameError,
  HelicopterHasFlightsError,
} from './helicopter.errors'

const helicopters = new Hono()
  .get('/', async (c) => {
    const list = await helicopterService.list()
    return c.json(list)
  })
  .get('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const helicopter = await helicopterService.getById(id)
      return c.json(helicopter)
    } catch (e) {
      if (e instanceof HelicopterNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .post('/', zValidator('json', createHelicopterSchema), async (c) => {
    try {
      const data = c.req.valid('json')
      const helicopter = await helicopterService.create(data)
      return c.json(helicopter, 201)
    } catch (e) {
      if (e instanceof DuplicateHelicopterNameError) return c.json({ error: e.message }, 400)
      throw e
    }
  })
  .put('/:id', zValidator('json', updateHelicopterSchema), async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const data = c.req.valid('json')
      const helicopter = await helicopterService.update(id, data)
      return c.json(helicopter)
    } catch (e) {
      if (e instanceof HelicopterNotFoundError) return c.json({ error: e.message }, 404)
      if (e instanceof DuplicateHelicopterNameError) return c.json({ error: e.message }, 400)
      throw e
    }
  })
  .delete('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      await helicopterService.delete(id)
      return c.json({ message: 'Helicopter deleted successfully' })
    } catch (e) {
      if (e instanceof HelicopterNotFoundError) return c.json({ error: e.message }, 404)
      if (e instanceof HelicopterHasFlightsError) {
        return c.json({ error: e.message, flightCount: e.flightCount }, 400)
      }
      throw e
    }
  })

export default helicopters
