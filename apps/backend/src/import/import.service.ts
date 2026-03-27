import * as fs from 'node:fs'
import * as path from 'node:path'
import prisma from '../db'
import { parsers } from './parsers'
import type { ParsedImport } from './import.types'

const BASE_DATA_DIR = process.env.IMPORT_DATA_DIR ?? 'data/imports'

export class ImportNotFoundError extends Error {
  constructor(id: number) {
    super(`Import ${id} not found`)
  }
}

export class UnknownFormatError extends Error {
  constructor(format: string) {
    super(`Unknown import format: ${format}. Available: ${Object.keys(parsers).join(', ')}`)
  }
}

function importDir(importId: number, format: string): string {
  return path.join(BASE_DATA_DIR, `${importId}_${format}`)
}

async function saveFiles(dir: string, files: File[]): Promise<void> {
  fs.mkdirSync(dir, { recursive: true })
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(dir, file.name), buf)
  }
}

async function persistParsedImport(importId: number, parsed: ParsedImport): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Create models
    const modelIdMap = new Map<string, number>()
    for (const m of parsed.models) {
      const created = await tx.model.upsert({
        where: { name: m.name },
        update: {},
        create: {
          name: m.name,
          importId,
        },
      })
      modelIdMap.set(m.name, created.id)
    }

    // Create batteries
    for (const battery of parsed.batteries) {
      await tx.battery.upsert({
        where: { name: battery.name },
        update: {},
        create: {
          name: battery.name,
          capacity: battery.capacity,
          cells: battery.cells ?? 0,
          importId,
        },
      })
    }

    // Create flights + telemetry
    for (const flight of parsed.flights) {
      const modelId = modelIdMap.get(flight.modelName)
      if (!modelId) continue

      const created = await tx.flight.create({
        data: {
          modelId,
          importId,
          date: flight.date,
          duration: flight.duration,
          minVoltage: flight.minVoltage,
          maxCurrent: flight.maxCurrent,
          maxPower: flight.maxPower,
          maxRPM: flight.maxRPM,
          chargeUsed: flight.chargeUsed,
        },
      })

      if (flight.telemetry.length > 0) {
        await tx.flightTelemetryPoint.createMany({
          data: flight.telemetry.map((t) => ({
            flightId: created.id,
            timestamp: t.timestamp,
            current: t.current,
            voltage: t.voltage,
            chargeUsed: t.chargeUsed,
            headspeed: t.headspeed,
            pwm: t.pwm,
            temp: t.temp,
          })),
        })
      }
    }
  })
}

async function deleteLinkedEntities(importId: number): Promise<void> {
  await prisma.$transaction([
    prisma.flightTelemetryPoint.deleteMany({
      where: { flight: { importId } },
    }),
    prisma.flight.deleteMany({ where: { importId } }),
    prisma.battery.deleteMany({ where: { importId } }),
    prisma.model.deleteMany({ where: { importId } }),
  ])
}

export const importService = {
  async create(
    files: File[],
    format: string,
    options: Record<string, string>,
    description?: string,
  ) {
    if (!parsers[format as keyof typeof parsers]) throw new UnknownFormatError(format)

    const record = await prisma.import.create({
      data: { format, description: description ?? null, rawDataPath: '' },
    })

    const dir = importDir(record.id, format)
    await saveFiles(dir, files)

    await prisma.import.update({
      where: { id: record.id },
      data: { rawDataPath: dir },
    })

    const parser = parsers[format as keyof typeof parsers] as unknown as {
      parse(rawDataPath: string, options: Record<string, string>): Promise<ParsedImport>
    }
    const parsed = await parser.parse(dir, options)
    await persistParsedImport(record.id, parsed)

    return importService.getById(record.id)
  },

  async list() {
    const imports = await prisma.import.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { models: true, flights: true, batteries: true },
        },
      },
    })
    return imports.map(({ _count, ...imp }) => ({
      ...imp,
      counts: _count,
    }))
  },

  async getById(id: number) {
    const record = await prisma.import.findUnique({
      where: { id },
      include: {
        _count: {
          select: { models: true, flights: true, batteries: true },
        },
      },
    })
    if (!record) throw new ImportNotFoundError(id)
    const { _count, ...imp } = record
    return { ...imp, counts: _count }
  },

  async delete(id: number) {
    const record = await prisma.import.findUnique({ where: { id } })
    if (!record) throw new ImportNotFoundError(id)

    await prisma.import.delete({ where: { id } })

    if (record.rawDataPath && fs.existsSync(record.rawDataPath)) {
      fs.rmSync(record.rawDataPath, { recursive: true, force: true })
    }
  },

  async reimport(id: number, options: Record<string, string> = {}) {
    const record = await prisma.import.findUnique({ where: { id } })
    if (!record) throw new ImportNotFoundError(id)
    if (!parsers[record.format as keyof typeof parsers]) throw new UnknownFormatError(record.format)

    await deleteLinkedEntities(id)

    const parser = parsers[record.format as keyof typeof parsers] as unknown as {
      parse(rawDataPath: string, options: Record<string, string>): Promise<ParsedImport>
    }
    const parsed = await parser.parse(record.rawDataPath, options)
    await persistParsedImport(id, parsed)

    return importService.getById(id)
  },
}
