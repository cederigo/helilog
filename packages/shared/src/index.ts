import { z } from 'zod'

export const createHelicopterSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  manufacturer: z.string().optional(),
  rotorDiameter: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  maintenanceInterval: z.number().positive().optional(),
})

export const updateHelicopterSchema = createHelicopterSchema.partial()

export const createFlightSchema = z.object({
  helicopterId: z.number().int().positive(),
  date: z.iso.datetime(),
  duration: z.number().int().positive(),
  batteryCycles: z.number().int().positive().optional(),
  flightMode: z.enum(['3D', 'Sport', 'GPS', 'Manual']).optional(),
  weather: z.string().optional(),
  temperature: z.number().optional(),
  windSpeed: z.number().optional(),
  notes: z.string().max(1000).optional(),
  location: z.string().optional(),
})

export const updateFlightSchema = createFlightSchema.partial()

export const createMaintenanceSchema = z.object({
  helicopterId: z.number().int().positive(),
  date: z.iso.datetime(),
  description: z.string().min(1),
  hoursAtMaintenance: z.number().positive(),
})

export type CreateHelicopterInput = z.infer<typeof createHelicopterSchema>
export type UpdateHelicopterInput = z.infer<typeof updateHelicopterSchema>
export type CreateFlightInput = z.infer<typeof createFlightSchema>
export type UpdateFlightInput = z.infer<typeof updateFlightSchema>
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
