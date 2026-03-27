import prisma from './db'
import { PrismaModelRepository } from './model/model.prisma'
import { PrismaFlightRepository } from './flight/flight.prisma'
import { PrismaMaintenanceRepository } from './maintenance/maintenance.prisma'
import { PrismaStatsRepository } from './stats/stats.prisma'
import { ModelService } from './model/model.service'
import { FlightService } from './flight/flight.service'
import { MaintenanceService } from './maintenance/maintenance.service'
import { StatsService } from './stats/stats.service'

const modelRepo = new PrismaModelRepository(prisma)
const flightRepo = new PrismaFlightRepository(prisma)
const maintenanceRepo = new PrismaMaintenanceRepository(prisma)
const statsRepo = new PrismaStatsRepository(prisma)

export const modelService = new ModelService(modelRepo, flightRepo)
export const flightService = new FlightService(flightRepo, modelRepo)
export const maintenanceService = new MaintenanceService(maintenanceRepo, modelRepo)
export const statsService = new StatsService(statsRepo, flightRepo)
