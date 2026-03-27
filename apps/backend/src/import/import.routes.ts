import { Hono } from 'hono'
import { importService, ImportNotFoundError, UnknownFormatError } from './import.service'
import { AuthError } from './parsers'

const imports = new Hono()
  .get('/', async (c) => {
    const list = await importService.list()
    return c.json(list)
  })
  .post('/', async (c) => {
    const body = await c.req.parseBody({ all: true })
    const files = (Array.isArray(body['files[]']) ? body['files[]'] : [body['files[]']]).filter(
      (f): f is File => f instanceof File,
    )

    const format = typeof body['format'] === 'string' ? body['format'] : ''
    if (!format) {
      return c.json({ error: 'format is required' }, 400)
    }

    // Parse options from the options=<JSON> form field
    let options: Record<string, string> = {}
    if (typeof body['options'] === 'string') {
      try {
        options = JSON.parse(body['options'])
      } catch {
        return c.json({ error: 'options must be valid JSON' }, 400)
      }
    }

    const description = typeof body['description'] === 'string' ? body['description'] : undefined

    try {
      const result = await importService.create(files, format, options, description)
      return c.json(result, 201)
    } catch (e) {
      if (e instanceof UnknownFormatError) return c.json({ error: e.message }, 400)
      if (e instanceof AuthError) return c.json({ error: e.message }, 401)
      throw e
    }
  })
  .get('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      const result = await importService.getById(id)
      return c.json(result)
    } catch (e) {
      if (e instanceof ImportNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .delete('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      await importService.delete(id)
      return c.json({ message: 'Import deleted successfully' })
    } catch (e) {
      if (e instanceof ImportNotFoundError) return c.json({ error: e.message }, 404)
      throw e
    }
  })
  .post('/:id/reimport', async (c) => {
    try {
      const id = parseInt(c.req.param('id'))
      let options: Record<string, string> = {}
      try {
        const body = await c.req.json()
        if (body && typeof body === 'object' && body.options) {
          options = body.options as Record<string, string>
        }
      } catch {
        // No body or invalid JSON — proceed with empty options
      }
      const result = await importService.reimport(id, options)
      return c.json(result)
    } catch (e) {
      if (e instanceof ImportNotFoundError) return c.json({ error: e.message }, 404)
      if (e instanceof UnknownFormatError) return c.json({ error: e.message }, 400)
      if (e instanceof AuthError) return c.json({ error: e.message }, 401)
      throw e
    }
  })

export default imports
