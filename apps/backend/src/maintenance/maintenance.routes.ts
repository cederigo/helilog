import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { maintenanceService } from '../container'
import { createMaintenanceSchema as baseCreateMaintenanceSchema } from '@helilog/shared'
import { ModelNotFoundError } from '../model/model.errors'

const createMaintenanceSchema = baseCreateMaintenanceSchema.extend({
  date: z.iso.datetime().transform((s) => new Date(s)),
})

const maintenance = new Hono()
  .post('/', zValidator('json', createMaintenanceSchema), async (c) => {
    try {
      const data = c.req.valid('json')
      const record = await maintenanceService.record(data)
      return c.json(record, 201)
    } catch (e) {
      if (e instanceof ModelNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .get('/models/:id/maintenance', async (c) => {
    const modelId = parseInt(c.req.param('id'))
    const records = await maintenanceService.getByModel(modelId)
    return c.json(records)
  })
  .get('/alerts', async (c) => {
    const result = await maintenanceService.getAlerts()
    return c.json(result)
  })

export default maintenance
