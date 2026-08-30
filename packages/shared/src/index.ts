import { z } from 'zod'

export const createModelSchema = z.object({
  name: z.string().min(1),
  maintenanceInterval: z.number().positive().optional(),
})

export const updateModelSchema = createModelSchema.partial()

export const mergeModelSchema = z.object({
  sourceId: z.number().int().positive(),
})

export const createFlightSchema = z.object({
  modelId: z.number().int().positive(),
  date: z.iso.datetime(),
  duration: z.number().int().positive(),
})

export const updateFlightSchema = createFlightSchema.partial()

export const flightQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['date', 'duration']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  modelId: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export const createMaintenanceSchema = z.object({
  modelId: z.number().int().positive(),
  date: z.iso.datetime(),
  description: z.string().min(1),
  hoursAtMaintenance: z.number().positive(),
})

export const createBatterySchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
})

export const createImportSchema = z.object({
  format: z.string().min(1),
  description: z.string().optional(),
})

export type CreateModelInput = z.infer<typeof createModelSchema>
export type UpdateModelInput = z.infer<typeof updateModelSchema>
export type MergeModelInput = z.infer<typeof mergeModelSchema>
export type CreateFlightInput = z.infer<typeof createFlightSchema>
export type UpdateFlightInput = z.infer<typeof updateFlightSchema>
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
export type FlightQueryInput = z.infer<typeof flightQuerySchema>
export type CreateBatteryInput = z.infer<typeof createBatterySchema>
export type CreateImportInput = z.infer<typeof createImportSchema>
