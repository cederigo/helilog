import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import prisma from '../db'

const maintenance = new Hono()

// Validation schema
const maintenanceSchema = z.object({
  helicopterId: z.number().int().positive(),
  date: z.string().datetime(),
  description: z.string().min(1),
  hoursAtMaintenance: z.number().positive(),
})

// POST /api/maintenance - Record maintenance
maintenance.post('/', zValidator('json', maintenanceSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    
    // Verify helicopter exists
    const helicopter = await prisma.helicopter.findUnique({
      where: { id: data.helicopterId }
    })
    
    if (!helicopter) {
      return c.json({ error: 'Helicopter not found' }, 404)
    }
    
    const record = await prisma.maintenanceRecord.create({
      data: {
        ...data,
        date: new Date(data.date)
      }
    })
    
    // Update helicopter's lastMaintenance
    await prisma.helicopter.update({
      where: { id: data.helicopterId },
      data: {
        lastMaintenance: new Date(data.date)
      }
    })
    
    return c.json(record, 201)
  } catch (error) {
    return c.json({ error: 'Failed to record maintenance' }, 500)
  }
})

// GET /api/helicopters/:id/maintenance - Get maintenance history for helicopter
maintenance.get('/helicopters/:id/maintenance', async (c) => {
  try {
    const helicopterId = parseInt(c.req.param('id'))
    
    const records = await prisma.maintenanceRecord.findMany({
      where: { helicopterId },
      orderBy: { date: 'desc' }
    })
    
    return c.json(records)
  } catch (error) {
    return c.json({ error: 'Failed to fetch maintenance records' }, 500)
  }
})

// GET /api/maintenance/alerts - Get maintenance alerts
maintenance.get('/alerts', async (c) => {
  try {
    const helicopters = await prisma.helicopter.findMany({
      include: {
        maintenance: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    })
    
    const alerts = helicopters
      .filter(h => h.maintenanceInterval && h.maintenanceInterval > 0)
      .map(h => {
        const lastMaintenanceHours = h.maintenance[0]?.hoursAtMaintenance || 0
        const hoursSinceMaintenance = h.totalHours - lastMaintenanceHours
        const nextDue = lastMaintenanceHours + (h.maintenanceInterval || 0)
        const hoursOverdue = h.totalHours - nextDue
        
        return {
          helicopter: {
            id: h.id,
            name: h.name,
            model: h.model
          },
          totalHours: h.totalHours,
          maintenanceInterval: h.maintenanceInterval,
          lastMaintenanceHours,
          hoursSinceMaintenance: Math.round(hoursSinceMaintenance * 100) / 100,
          nextDueAt: Math.round(nextDue * 100) / 100,
          hoursOverdue: Math.round(hoursOverdue * 100) / 100,
          status: hoursOverdue > 0 ? 'overdue' : 
                  hoursSinceMaintenance >= (h.maintenanceInterval || 0) - 1 ? 'due_soon' : 
                  'ok'
        }
      })
      .filter(a => a.status !== 'ok')
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue)
    
    return c.json({ alerts })
  } catch (error) {
    return c.json({ error: 'Failed to fetch maintenance alerts' }, 500)
  }
})

export default maintenance
