import * as fs from 'node:fs'
import * as path from 'node:path'
import type {
  ImportParser,
  ParsedFlight,
  ParsedImport,
  ParsedModel,
  ParsedTelemetryPoint,
} from '../import.types'

// EdgeTX radio telemetry log import parser — edgetx
//
// EdgeTX writes one CSV per radio session to the SD card. The filename encodes the
// model name and start time: "<MODEL NAME>-YYYY-MM-DD-HHMMSS.csv".
//
// The header row lists column names; the available columns vary between files and
// firmware versions, so every column is looked up by name. Data rows are logged
// roughly once per second with millisecond-precision timestamps.
//
// Column → ParsedTelemetryPoint mapping:
//   Hspd(rpm)          → headspeed
//   Curr(A)            → current
//   Vbat(V) / RxBt(V)  → voltage (pack voltage; the column name depends on the sensor)
//   Capa(mAh)          → chargeUsed (cumulative)
//   Tesc(°C)           → temp (ESC temperature)
//   (no PWM channel)   → pwm is always 0
//
// One file yields at most one flight. Flight detection:
//   1. If the rotor spun (or the ESC drew current) for at least MIN_FLIGHT_SECONDS,
//      that is a flight and duration = the spinning time. Aggregate metrics
//      (min voltage, max current/power/rpm, charge used) come from the telemetry.
//   2. Otherwise, if the session ran for at least FALLBACK_MIN_SECONDS, treat it as
//      a flight whose ESC telemetry link was down: duration = the full session span,
//      no telemetry points, no aggregate metrics.
//   3. Otherwise the file is skipped (brief link tests, short bench sessions).

const FILENAME_RE = /^(.+)-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/i

// A per-second sample counts as "flying" when headspeed exceeds this (rpm) ...
const SPIN_RPM_MIN = 100
// ... or when ESC current draw exceeds this (A).
const SPIN_CURRENT_MIN = 2
// Minimum spinning time for an ESC-telemetry flight (seconds).
const MIN_FLIGHT_SECONDS = 5
// Minimum session span for a flight with no usable ESC telemetry (seconds).
const FALLBACK_MIN_SECONDS = 60

export function parseModelName(filename: string): string | null {
  const match = FILENAME_RE.exec(filename)
  if (!match) return null
  const name = match[1].trim()
  return name.length > 0 ? name : null
}

function splitCsvLine(line: string): string[] {
  return line.split(',').map((c) => c.trim())
}

function parseTimestamp(dateStr: string, timeStr: string): Date {
  // "2026-08-29" + "15:13:04.440" → local time (matches the vbar_v2 convention)
  return new Date(`${dateStr}T${timeStr}`)
}

export function parseEdgetxFile(filename: string, content: string): ParsedFlight | null {
  const modelName = parseModelName(filename)
  if (!modelName) return null

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length < 2) return null

  const header = splitCsvLine(lines[0])
  const col = new Map(header.map((name, i) => [name, i] as const))
  const dateIdx = col.get('Date')
  const timeIdx = col.get('Time')
  if (dateIdx === undefined || timeIdx === undefined) return null

  const rpmIdx = col.get('Hspd(rpm)')
  const currentIdx = col.get('Curr(A)')
  const voltageIdx = col.get('Vbat(V)') ?? col.get('RxBt(V)')
  const chargeIdx = col.get('Capa(mAh)')
  const tempIdx = col.get('Tesc(°C)')

  // Bucket rows by whole second and average within each bucket (rows are ~1 Hz, but
  // some firmware logs faster). Missing columns read as 0.
  const buckets = new Map<number, ParsedTelemetryPoint[]>()
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const timestamp = parseTimestamp(cells[dateIdx] ?? '', cells[timeIdx] ?? '')
    if (Number.isNaN(timestamp.getTime())) continue
    const cell = (idx: number | undefined): number =>
      idx === undefined ? 0 : parseFloat(cells[idx] ?? '') || 0
    const point: ParsedTelemetryPoint = {
      timestamp,
      current: cell(currentIdx),
      voltage: cell(voltageIdx),
      chargeUsed: cell(chargeIdx),
      headspeed: Math.round(cell(rpmIdx)),
      pwm: 0,
      temp: cell(tempIdx),
    }
    const key = Math.floor(timestamp.getTime() / 1000) * 1000
    const bucket = buckets.get(key) ?? []
    bucket.push(point)
    buckets.set(key, bucket)
  }

  const telemetry: ParsedTelemetryPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, points]) => {
      const avg = (fn: (p: ParsedTelemetryPoint) => number) =>
        Math.round((points.reduce((s, p) => s + fn(p), 0) / points.length) * 10) / 10
      return {
        timestamp: new Date(key),
        current: avg((p) => p.current),
        voltage: avg((p) => p.voltage),
        chargeUsed: avg((p) => p.chargeUsed),
        headspeed: Math.round(points.reduce((s, p) => s + p.headspeed, 0) / points.length),
        pwm: 0,
        temp: avg((p) => p.temp),
      }
    })

  if (telemetry.length === 0) return null

  const spinSeconds = telemetry.filter(
    (p) => p.headspeed > SPIN_RPM_MIN || p.current > SPIN_CURRENT_MIN,
  ).length
  const spanSeconds = Math.round(
    (telemetry[telemetry.length - 1].timestamp.getTime() - telemetry[0].timestamp.getTime()) / 1000,
  )

  const escBased = spinSeconds >= MIN_FLIGHT_SECONDS
  if (!escBased && spanSeconds < FALLBACK_MIN_SECONDS) return null

  const flight: ParsedFlight = {
    date: telemetry[0].timestamp,
    duration: escBased ? spinSeconds : spanSeconds,
    modelName,
    telemetry: escBased ? telemetry : [],
  }

  if (escBased) {
    const positiveVoltages = telemetry.map((p) => p.voltage).filter((v) => v > 0)
    if (positiveVoltages.length > 0) flight.minVoltage = Math.min(...positiveVoltages)
    if (currentIdx !== undefined) {
      flight.maxCurrent = Math.max(...telemetry.map((p) => p.current))
      if (positiveVoltages.length > 0) {
        flight.maxPower =
          Math.round(Math.max(...telemetry.map((p) => p.current * p.voltage)) * 100) / 100
      }
    }
    if (rpmIdx !== undefined) flight.maxRPM = Math.max(...telemetry.map((p) => p.headspeed))
    if (chargeIdx !== undefined) flight.chargeUsed = telemetry[telemetry.length - 1].chargeUsed
  }

  return flight
}

export function parseEdgetxDir(rawDataPath: string): ParsedImport {
  const files = fs.readdirSync(rawDataPath).filter((f) => /\.csv$/i.test(f))

  const flights: ParsedFlight[] = []
  for (const file of files) {
    const content = fs.readFileSync(path.join(rawDataPath, file), 'utf8')
    const flight = parseEdgetxFile(file, content)
    if (flight) flights.push(flight)
  }

  const models: ParsedModel[] = Array.from(new Set(flights.map((f) => f.modelName))).map(
    (name) => ({
      name,
    }),
  )
  return { models, flights, batteries: [] }
}

export const edgetxParser: ImportParser<Record<string, never>> = {
  async parse(rawDataPath: string): Promise<ParsedImport> {
    return parseEdgetxDir(rawDataPath)
  },
}
