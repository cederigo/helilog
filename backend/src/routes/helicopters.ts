import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import prisma from '../db'

const helicopters = new Hono()

// Validation schema
const helicopterSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  manufacturer: z.string().optional(),
  rotorDiameter: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  maintenanceInterval: z.number().positive().optional(),
})

// GET /api/helicopters - List all helicopters
helicopters.get('/', async (c) => {
  try {
    const helicopterList = await prisma.helicopter.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { flights: true, maintenance: true }
        }
      }
    })
    return c.json(helicopterList)
  } catch (error) {
    return c.json({ error: 'Failed to fetch helicopters' }, 500)
  }
})

// GET /api/helicopters/:id - Get helicopter details
helicopters.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const helicopter = await prisma.helicopter.findUnique({
      where: { id },
      include: {
        flights: {
          orderBy: { date: 'desc' },
          take: 10
        },
        maintenance: {
          orderBy: { date: 'desc' }
        }
      }
    })
    
    if (!helicopter) {
      return c.json({ error: 'Helicopter not found' }, 404)
    }
    
    return c.json(helicopter)
  } catch (error) {
    return c.json({ error: 'Failed to fetch helicopter' }, 500)
  }
})

// POST /api/helicopters - Create new helicopter
helicopters.post('/', zValidator('json', helicopterSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    
    // Check for duplicate name
    const existing = await prisma.helicopter.findUnique({
      where: { name: data.name }
    })
    
    if (existing) {
      return c.json({ error: 'Helicopter with this name already exists' }, 400)
    }
    
    const helicopter = await prisma.helicopter.create({
      data: {
        ...data,
        totalHours: 0
      }
    })
    
    return c.json(helicopter, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create helicopter' }, 500)
  }
})

// PUT /api/helicopters/:id - Update helicopter
helicopters.put('/:id', zValidator('json', helicopterSchema.partial()), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const data = c.req.valid('json')
    
    // Check if name is being changed and if it conflicts
    if (data.name) {
      const existing = await prisma.helicopter.findUnique({
        where: { name: data.name }
      })
      
      if (existing && existing.id !== id) {
        return c.json({ error: 'Helicopter with this name already exists' }, 400)
      }
    }
    
    const helicopter = await prisma.helicopter.update({
      where: { id },
      data
    })
    
    return c.json(helicopter)
  } catch (error) {
    return c.json({ error: 'Failed to update helicopter' }, 500)
  }
})

// DELETE /api/helicopters/:id - Delete helicopter
helicopters.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    // Check if helicopter has flights
    const flightCount = await prisma.flight.count({
      where: { helicopterId: id }
    })
    
    if (flightCount > 0) {
      return c.json({ 
        error: 'Cannot delete helicopter with existing flights',
        flightCount 
      }, 400)
    }
    
    await prisma.helicopter.delete({
      where: { id }
    })
    
    return c.json({ message: 'Helicopter deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete helicopter' }, 500)
  }
})

export default helicopters
