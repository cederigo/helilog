import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import prisma from '../db'

const flights = new Hono()

// Validation schema
const flightSchema = z.object({
  helicopterId: z.number().int().positive(),
  date: z.string().datetime(),
  duration: z.number().int().positive(), // in minutes
  batteryCycles: z.number().int().positive().optional(),
  flightMode: z.enum(['3D', 'Sport', 'GPS', 'Manual']).optional(),
  weather: z.string().optional(),
  temperature: z.number().optional(),
  windSpeed: z.number().optional(),
  notes: z.string().max(1000).optional(),
  location: z.string().optional(),
})

// Helper function to update helicopter total hours
async function updateHelicopterHours(helicopterId: number) {
  const flights = await prisma.flight.findMany({
    where: { helicopterId },
    select: { duration: true }
  })
  
  const totalMinutes = flights.reduce((sum, flight) => sum + flight.duration, 0)
  const totalHours = totalMinutes / 60
  
  await prisma.helicopter.update({
    where: { id: helicopterId },
    data: { totalHours }
  })
}

// GET /api/flights - List flights
flights.get('/', async (c) => {
  try {
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
      limit = '50'
    } = c.req.query()
    
    const where: any = {}
    
    if (helicopterId) {
      where.helicopterId = parseInt(helicopterId)
    }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }
    
    // Text search in notes
    if (search) {
      where.notes = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    // Flight mode filter
    if (flightMode) {
      where.flightMode = flightMode
    }
    
    // Weather filter
    if (weather) {
      where.weather = {
        contains: weather,
        mode: 'insensitive'
      }
    }
    
    const orderBy: any = {}
    if (sortBy === 'date' || sortBy === 'duration') {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.date = 'desc' // default
    }
    
    // Pagination
    const pageNum = parseInt(page)
    const pageSize = parseInt(limit)
    const skip = (pageNum - 1) * pageSize
    
    const [flightList, total] = await Promise.all([
      prisma.flight.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          helicopter: {
            select: { id: true, name: true, model: true }
          }
        }
      }),
      prisma.flight.count({ where })
    ])
    
    return c.json({
      flights: flightList,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch flights' }, 500)
  }
})

// GET /api/flights/:id - Get flight details
flights.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const flight = await prisma.flight.findUnique({
      where: { id },
      include: {
        helicopter: true
      }
    })
    
    if (!flight) {
      return c.json({ error: 'Flight not found' }, 404)
    }
    
    return c.json(flight)
  } catch (error) {
    return c.json({ error: 'Failed to fetch flight' }, 500)
  }
})

// POST /api/flights - Create flight log
flights.post('/', zValidator('json', flightSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    
    // Verify helicopter exists
    const helicopter = await prisma.helicopter.findUnique({
      where: { id: data.helicopterId }
    })
    
    if (!helicopter) {
      return c.json({ error: 'Helicopter not found' }, 404)
    }
    
    const flight = await prisma.flight.create({
      data: {
        ...data,
        date: new Date(data.date)
      }
    })
    
    // Update helicopter total hours
    await updateHelicopterHours(data.helicopterId)
    
    return c.json(flight, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create flight log' }, 500)
  }
})

// PUT /api/flights/:id - Update flight
flights.put('/:id', zValidator('json', flightSchema.partial()), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const data = c.req.valid('json')
    
    const existingFlight = await prisma.flight.findUnique({
      where: { id }
    })
    
    if (!existingFlight) {
      return c.json({ error: 'Flight not found' }, 404)
    }
    
    const updateData: any = { ...data }
    if (data.date) {
      updateData.date = new Date(data.date)
    }
    
    const flight = await prisma.flight.update({
      where: { id },
      data: updateData
    })
    
    // Update helicopter total hours (for both old and new helicopter if changed)
    await updateHelicopterHours(existingFlight.helicopterId)
    if (data.helicopterId && data.helicopterId !== existingFlight.helicopterId) {
      await updateHelicopterHours(data.helicopterId)
    }
    
    return c.json(flight)
  } catch (error) {
    return c.json({ error: 'Failed to update flight' }, 500)
  }
})

// DELETE /api/flights/:id - Delete flight
flights.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    const flight = await prisma.flight.findUnique({
      where: { id }
    })
    
    if (!flight) {
      return c.json({ error: 'Flight not found' }, 404)
    }
    
    await prisma.flight.delete({
      where: { id }
    })
    
    // Update helicopter total hours
    await updateHelicopterHours(flight.helicopterId)
    
    return c.json({ message: 'Flight deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete flight' }, 500)
  }
})

export default flights
