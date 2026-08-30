import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { modelService } from '../container'
import { createModelSchema, updateModelSchema, mergeModelSchema } from '@helilog/shared'
import {
  ModelNotFoundError,
  DuplicateModelNameError,
  ModelHasFlightsError,
  ModelMergeIntoSelfError,
} from './model.errors'

const models = new Hono()
  .get('/', async (c) => {
    const list = await modelService.list()
    return c.json(list)
  })
  .get('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const model = await modelService.getById(id)
      return c.json(model)
    } catch (e) {
      if (e instanceof ModelNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .post('/', zValidator('json', createModelSchema), async (c) => {
    try {
      const data = c.req.valid('json')
      const model = await modelService.create(data)
      return c.json(model, 201)
    } catch (e) {
      if (e instanceof DuplicateModelNameError) return c.json({ error: e.message }, 400)
      throw e
    }
  })
  .put('/:id', zValidator('json', updateModelSchema), async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const data = c.req.valid('json')
      const model = await modelService.update(id, data)
      return c.json(model)
    } catch (e) {
      if (e instanceof ModelNotFoundError) return c.json({ error: e.message }, 404)
      if (e instanceof DuplicateModelNameError) return c.json({ error: e.message }, 400)
      throw e
    }
  })
  .post('/:id/merge', zValidator('json', mergeModelSchema), async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const { sourceId } = c.req.valid('json')
      const model = await modelService.merge(id, sourceId)
      return c.json(model)
    } catch (e) {
      if (e instanceof ModelNotFoundError) return c.json({ error: e.message }, 404)
      if (e instanceof ModelMergeIntoSelfError) return c.json({ error: e.message }, 400)
      throw e
    }
  })
  .delete('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      await modelService.delete(id)
      return c.json({ message: 'Model deleted successfully' })
    } catch (e) {
      if (e instanceof ModelNotFoundError) return c.json({ error: e.message }, 404)
      if (e instanceof ModelHasFlightsError) {
        return c.json({ error: e.message, flightCount: e.flightCount }, 400)
      }
      throw e
    }
  })

export default models
