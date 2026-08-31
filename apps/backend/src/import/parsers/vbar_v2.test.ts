import assert from 'node:assert/strict'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import * as url from 'node:url'
import type { ParsedFlight } from '../import.types'
import {
  type BatteryInfo,
  type ParsedBatteryWithFlights,
  annotateFlightsWithBatteries,
  parseBatteryLogCsv,
  parseCsvFiles,
  readBatteryLogs,
} from './vbar_v2'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const testdataPath = path.join(__dirname, 'testdata', 'vbar_v2')

const MODEL_OXY5 = 'OXY 5'
const MODEL_TREX600 = 'TREX 600'

// Format a Date as local "YYYY-MM-DDTHH:MM:SS" for timezone-safe comparisons
function localISOString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const EXPECTED_FLIGHTS = [
  {
    modelName: MODEL_OXY5,
    date: '2025-06-27T11:37:50',
    duration: 15,
    minVoltage: 26.9,
    maxCurrent: 12.6,
    chargeUsed: 50,
    maxPower: 338.94,
    maxRPM: 1200,
    telemetryLength: 2,
  },
  {
    modelName: MODEL_TREX600,
    date: '2020-03-24T21:32:03',
    duration: 145,
    minVoltage: undefined,
    maxCurrent: undefined,
    chargeUsed: undefined,
    maxPower: undefined,
    maxRPM: undefined,
    telemetryLength: 0,
  },
]

describe('vbarV2Parser.parse (csv reimport)', () => {
  it('parses all flights with correct values', async () => {
    const result = await parseCsvFiles(testdataPath)
    const actual = EXPECTED_FLIGHTS.map(({ modelName }) => {
      const f = result.flights.find((f) => f.modelName === modelName)!
      return {
        modelName: f.modelName,
        date: localISOString(f.date),
        duration: f.duration,
        minVoltage: f.minVoltage,
        maxCurrent: f.maxCurrent,
        chargeUsed: f.chargeUsed,
        maxPower: f.maxPower,
        maxRPM: f.maxRPM,
        telemetryLength: f.telemetry.length,
      }
    })
    assert.deepEqual(actual, EXPECTED_FLIGHTS)
  })
})

describe('parseBatteryLogCsv', () => {
  it('collects flightnos and ignores short/blank lines', () => {
    const csv = [
      '27.06.2025 11:40:50;5000;23;17;0.0;12.6;27.1;0020029606;1751024269;OXY 5',
      '',
      'garbage;row',
      '27.06.2025 13:50:51;5000;2715;321;24.1;88.8;26.3;0020029606;1751031777;OXY 5',
    ].join('\n')
    assert.deepEqual(parseBatteryLogCsv(csv), [1751024269, 1751031777])
  })
})

describe('readBatteryLogs', () => {
  const info = (id: string, name: string): BatteryInfo => ({
    id,
    name,
    capacity: 5000,
    cells: 6,
  })

  it('pairs each in-memory BatteryInfo with flightNos from its <id>_log.csv', () => {
    const batteries = readBatteryLogs(testdataPath, [
      info('bt_16', 'Neuer Akku 16'),
      info('bt_14', '02 1st'),
    ])
    const bt16 = batteries.find((b) => b.id === 'bt_16')!
    const bt14 = batteries.find((b) => b.id === 'bt_14')!

    assert.equal(bt16.name, 'Neuer Akku 16')
    assert.deepEqual(bt16.flightNos.sort(), [1751024269, 1751031777])
    assert.deepEqual(bt14.flightNos, [1640604638])
  })

  it('leaves flightNos empty when the log CSV is missing', () => {
    const [battery] = readBatteryLogs(testdataPath, [info('bt_999', 'no log')])
    assert.deepEqual(battery.flightNos, [])
  })
})

describe('annotateFlightsWithBatteries', () => {
  const flight = (sourceId: string): ParsedFlight => ({
    date: new Date('2025-06-27T11:37:50'),
    duration: 15,
    modelName: 'OXY 5',
    telemetry: [],
    sourceId,
  })
  const battery = (name: string, flightNos: number[]): ParsedBatteryWithFlights => ({
    id: name,
    name,
    capacity: 5000,
    cells: 6,
    flightNos,
  })

  it('links a flight whose id appears in a battery flight list', () => {
    const flights = [flight('F1751024269'), flight('F999')]
    annotateFlightsWithBatteries(flights, [battery('pack a', [1751024269])])
    assert.equal(flights[0].batteryName, 'pack a')
    assert.equal(flights[1].batteryName, undefined)
  })

  it('keeps the first battery when two claim the same flight', () => {
    const flights = [flight('F1751024269')]
    annotateFlightsWithBatteries(flights, [
      battery('pack a', [1751024269]),
      battery('pack b', [1751024269]),
    ])
    assert.equal(flights[0].batteryName, 'pack a')
  })
})

describe('readBatteryLogs + annotateFlightsWithBatteries', () => {
  it('links a parsed flight to the pack whose log lists its flightno', () => {
    const { flights } = parseCsvFiles(testdataPath)
    const batteries = readBatteryLogs(testdataPath, [
      { id: 'bt_16', name: 'Neuer Akku 16', capacity: 4958, cells: 7 },
    ])
    annotateFlightsWithBatteries(flights, batteries)

    const oxy = flights.find((f) => f.modelName === MODEL_OXY5)!
    const trex = flights.find((f) => f.modelName === MODEL_TREX600)!
    assert.equal(oxy.batteryName, 'Neuer Akku 16')
    assert.equal(trex.batteryName, undefined)
  })
})
