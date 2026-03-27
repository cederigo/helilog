import assert from 'node:assert/strict'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import * as url from 'node:url'
import { parseCsvFiles } from './vbar_v2'

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
