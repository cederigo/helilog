import prisma from './db'
import { PrismaHelicopterRepository } from './helicopter/helicopter.prisma'
import { PrismaFlightRepository } from './flight/flight.prisma'
import { PrismaMaintenanceRepository } from './maintenance/maintenance.prisma'
import { PrismaStatsRepository } from './stats/stats.prisma'
import { HelicopterService } from './helicopter/helicopter.service'
import { FlightService } from './flight/flight.service'
import { MaintenanceService } from './maintenance/maintenance.service'
import { StatsService } from './stats/stats.service'

const helicopterRepo = new PrismaHelicopterRepository(prisma)
const flightRepo = new PrismaFlightRepository(prisma)
const maintenanceRepo = new PrismaMaintenanceRepository(prisma)
const statsRepo = new PrismaStatsRepository(prisma)

export const helicopterService = new HelicopterService(helicopterRepo, flightRepo)
export const flightService = new FlightService(flightRepo, helicopterRepo)
export const maintenanceService = new MaintenanceService(maintenanceRepo, helicopterRepo)
export const statsService = new StatsService(statsRepo, flightRepo)
