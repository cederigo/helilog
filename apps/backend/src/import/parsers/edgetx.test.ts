import assert from 'node:assert/strict'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import * as url from 'node:url'
import { parseEdgetxDir, parseModelName } from './edgetx'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const testdataPath = path.join(__dirname, 'testdata', 'edgetx')

// Format a Date as local "YYYY-MM-DDTHH:MM:SS" for timezone-safe comparisons
function localISOString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// testdata/edgetx/ holds five real logs:
//   GOOSKY S2-2026-08-18-113158.csv   — a normal flight (Hspd + Capa + Tesc)
//   Oxy5-2026-08-15-142457.csv        — a normal flight, high current
//   Logo700-2026-08-29-152349.csv     — flew with the ESC telemetry link down:
//                                       no Hspd/Curr/Vbat, but a 6+ min session →
//                                       imported via the span fallback, no telemetry
//   GOOSKY S2-2026-08-14-173130.csv   — a 43 s idle session → skipped (under the span floor)
//   GOOSKY F405-2026-08-14-172308.csv — a one-row link test → skipped
const EXPECTED_FLIGHTS = [
  {
    modelName: 'GOOSKY S2',
    date: '2026-08-18T11:31:58',
    duration: 205,
    minVoltage: 10.2,
    maxCurrent: 26.4,
    maxPower: 269.28,
    maxRPM: 5812,
    chargeUsed: 546,
    telemetryLength: 206,
  },
  {
    modelName: 'Logo700',
    date: '2026-08-29T15:23:49',
    duration: 370,
    minVoltage: undefined,
    maxCurrent: undefined,
    maxPower: undefined,
    maxRPM: undefined,
    chargeUsed: undefined,
    telemetryLength: 0,
  },
  {
    modelName: 'Oxy5',
    date: '2026-08-15T14:24:57',
    duration: 335,
    minVoltage: 24.4,
    maxCurrent: 88.4,
    maxPower: 2245.36,
    maxRPM: 2225,
    chargeUsed: 3617,
    telemetryLength: 346,
  },
]

describe('parseModelName', () => {
  it('extracts the model name from an EdgeTX filename', () => {
    assert.equal(parseModelName('GOOSKY S2-2026-08-18-113158.csv'), 'GOOSKY S2')
    assert.equal(parseModelName('Logo700-2026-07-21-174534.csv'), 'Logo700')
  })

  it('returns null for a filename that does not match the pattern', () => {
    assert.equal(parseModelName('random.csv'), null)
    assert.equal(parseModelName('summary.txt'), null)
  })
})

describe('parseEdgetxDir', () => {
  const result = parseEdgetxDir(testdataPath)

  it('parses real flights (incl. the ESC-telemetry-down fallback) and skips short sessions', () => {
    const actual = result.flights
      .map((f) => ({
        modelName: f.modelName,
        date: localISOString(f.date),
        duration: f.duration,
        minVoltage: f.minVoltage,
        maxCurrent: f.maxCurrent,
        maxPower: f.maxPower,
        maxRPM: f.maxRPM,
        chargeUsed: f.chargeUsed,
        telemetryLength: f.telemetry.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    assert.deepEqual(
      actual,
      [...EXPECTED_FLIGHTS].sort((a, b) => a.date.localeCompare(b.date)),
    )
  })

  it('returns one deduped model entry per flown model, no batteries', () => {
    assert.deepEqual(result.models.map((m) => m.name).sort(), ['GOOSKY S2', 'Logo700', 'Oxy5'])
    assert.deepEqual(result.batteries, [])
  })

  it('produces per-second telemetry points with the mapped fields', () => {
    const flight = result.flights.find((f) => f.modelName === 'GOOSKY S2')!
    const first = flight.telemetry[0]
    assert.equal(first.pwm, 0) // EdgeTX has no PWM channel
    assert.ok(first.voltage > 0)
    assert.equal(flight.chargeUsed, flight.telemetry[flight.telemetry.length - 1].chargeUsed)
  })
})
