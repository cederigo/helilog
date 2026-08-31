import * as cheerio from 'cheerio'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type {
  ImportParser,
  ParsedFlight,
  ParsedImport,
  ParsedTelemetryPoint,
  VbarV2Options,
} from '../import.types'

// VBar Cloud (vstabi.info) import parser — vbar_v2
//
// The vstabi.info cloud stores flight data in HTML pages. Each flight detail
// page contains two <textarea> elements:
//   [0] Event log  – timestamped event entries, one per line:
//       "DD.MM.YYYY HH:MM:SS[status];event message"
//       First line:  "DD.MM.YYYY HH:MM:SS;VStabi Start -- MODEL -- SERIAL -- ..."
//       Last line:   "DD.MM.YYYY HH:MM:SS;VBar Logfile End -- DD.MM.YYYY -- HH:MM:SS"
//       Motor-off:   "DD.MM.YYYY HH:MM:SS Info;Aus - Regler - Umin:X.XV Imax:X.XA Temp:X°"
//   [1] Telemetry  – header row + data rows:
//       timestamp;current_A;voltage_V;chargeUsed_mAh;headspeed_rpm;pwm_pct;temp_C
//
// The download phase (inside parse()) writes:
//   F<id>_event.csv      – event log textarea content
//   F<id>_telemetry.csv  – telemetry textarea content (only when present)
//   <bat-id>_log.csv     – per-battery flight-log CSV (flightno → battery link)
//
// Reimport: if F*_event.csv files already exist in rawDataPath the download
// phase is skipped and the parser re-reads the saved files directly. Battery
// logs are always re-downloaded (a pack's log grows on every reuse); pack
// name/capacity/cells come from the overview page and are never persisted.

const LOGIN_URL = 'https://www.vstabi.info/de/user/login'
const CLOUD_URL = 'https://www.vstabi.info/de/cloud'
const PAGE_SIZE = 30
const FETCH_DELAY_MS = 200

// Battery overview page + per-battery flight-log CSV. Each CSV row carries a
// flightno column (the same numeric id used for F<id>_event.csv), so a flight is
// linked to its battery by an exact id join, no date matching required.
//
// The CSV download endpoint comes from the "Download" form on the battery detail
// page: GET node/2243?view=-1&file=<bat-id>&Sid=<sid>. node/2243 is a fixed
// endpoint; the form's `file` field is the battery id (e.g. "bt_16").
const BATTERY_LOG_URL = 'https://www.vstabi.info/node/2243'

// -----------------------------------------------------------------
// Errors
// -----------------------------------------------------------------

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function parseGermanDate(s: string): Date {
  // DD.MM.YYYY HH:MM:SS → ISO-compatible
  const [datePart, timePart] = s.trim().split(' ')
  if (!datePart || !timePart) return new Date(NaN)
  const [day, month, year] = datePart.split('.')
  return new Date(`${year}-${month}-${day}T${timePart}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -----------------------------------------------------------------
// Cloud authentication
// -----------------------------------------------------------------

async function login(username: string, password: string): Promise<string> {
  // 1. Fetch the login page to extract the CSRF form_build_id
  const loginPageRes = await fetch(LOGIN_URL)
  const loginHtml = await loginPageRes.text()
  const $ = cheerio.load(loginHtml)
  const formBuildId = $('input[name="form_build_id"]').val() as string | undefined
  if (!formBuildId) {
    throw new AuthError('Could not extract form_build_id from vstabi.info login page')
  }

  // 2. POST credentials – stop at the redirect so we can read Set-Cookie
  const form = new URLSearchParams()
  form.set('name', username)
  form.set('pass', password)
  form.set('form_build_id', formBuildId)
  form.set('form_id', 'user_login')
  form.set('op', 'Anmelden')

  const loginRes = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    redirect: 'manual',
  })

  // Drupal redirects away from the login page on success
  const location = loginRes.headers.get('location') ?? ''
  if ((loginRes.status !== 301 && loginRes.status !== 302) || location.includes('/user/login')) {
    throw new AuthError('Login failed: invalid credentials or unexpected response from vstabi.info')
  }

  // Extract the Drupal session cookie (SESS* or SSESS*)
  const rawCookies = loginRes.headers.get('set-cookie') ?? ''
  const cookieMatch = rawCookies.match(/S?SESS\w+=[^;]+/)
  if (!cookieMatch) {
    throw new AuthError('Login failed: session cookie not found in vstabi.info response')
  }
  return cookieMatch[0]
}

// -----------------------------------------------------------------
// Flight list pagination
// -----------------------------------------------------------------

async function fetchAllFlightIds(cookie: string): Promise<{ flightIds: number[]; sid: string }> {
  const allIds = new Set<number>()
  let sid = ''
  let start = 0

  while (true) {
    const url = `${CLOUD_URL}?action=flightlist&start=${start}`
    const res = await fetch(url, { headers: { Cookie: cookie } })
    const html = await res.text()
    const $ = cheerio.load(html)

    // Collect all hrefs from anchor elements that contain flightno
    const hrefs: string[] = []
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? ''
      if (href.includes('flightno=')) hrefs.push(href)
    })

    if (hrefs.length === 0) break

    for (const href of hrefs) {
      const flightMatch = href.match(/flightno=(\d+)/)
      if (flightMatch) allIds.add(parseInt(flightMatch[1]))

      // Extract Sid from the first href that contains it
      if (!sid) {
        const sidMatch = href.match(/[?&]Sid=([A-Za-z0-9]+)/)
        if (sidMatch) sid = sidMatch[1]
      }
    }

    start += PAGE_SIZE
  }

  return { flightIds: [...allIds], sid }
}

// -----------------------------------------------------------------
// Per-flight HTML download and textarea extraction
// -----------------------------------------------------------------

async function downloadFlights(
  flightIds: number[],
  cookie: string,
  destDir: string,
  sid: string,
): Promise<void> {
  fs.mkdirSync(destDir, { recursive: true })

  let fetchCount = 0
  for (let i = 0; i < flightIds.length; i++) {
    const flightId = flightIds[i]

    // Skip flights whose CSV files already exist on disk
    if (fs.existsSync(path.join(destDir, `F${flightId}_event.csv`))) {
      console.log(
        `Skipping flight ${flightId} (${i + 1} of ${flightIds.length}) — CSV already exists`,
      )
      continue
    }

    console.log(`Downloading data for flight ${flightId} (${i + 1} of ${flightIds.length})...`)
    // Polite delay between requests (skip before first download)
    if (fetchCount > 0) await sleep(FETCH_DELAY_MS)
    fetchCount++

    const url = `${CLOUD_URL}?action=edit_flight&Sid=${sid}&flightno=${flightId}`
    const res = await fetch(url, { headers: { Cookie: cookie } })
    const html = await res.text()
    const $ = cheerio.load(html)

    const textareas = $('textarea')
    const eventLog = textareas.eq(0).text().trim()
    const telemetry = textareas.eq(1).text().trim()

    if (eventLog) {
      fs.writeFileSync(path.join(destDir, `F${flightId}_event.csv`), eventLog, 'utf8')
    } else {
      console.warn(`Warning: no event log found for flight ${flightId}, skipping...`)
    }
    if (telemetry) {
      fs.writeFileSync(path.join(destDir, `F${flightId}_telemetry.csv`), telemetry, 'utf8')
    }
  }
}

// -----------------------------------------------------------------
// Battery overview list + per-battery flight-log CSV download
// -----------------------------------------------------------------

export interface BatteryInfo {
  id: string // "bt_14" — the cloud's battery identifier
  name: string // user-assigned pack name
  capacity: number // mAh
  cells: number
}

function batteryLogFileName(id: string): string {
  return `${id.replace(/[^\w-]/g, '')}_log.csv`
}

// Text of a "<line1><br><line2>" cell up to the first <br>, whitespace-collapsed.
function firstLine(cellHtml: string): string {
  const head = cellHtml.split(/<br\s*\/?>/i)[0] ?? ''
  return cheerio.load(head).text().replace(/\s+/g, ' ').trim()
}

// Parse the "All batteries overview" table. Each battery row holds cells +
// capacity, the pack name, and a "Details" link carrying name=bt_<n>. The pack
// name/capacity/cells live only here — the flight-log CSV does not repeat them.
function parseBatteryListHtml(html: string): BatteryInfo[] {
  const $ = cheerio.load(html)
  const entries: BatteryInfo[] = []
  const seen = new Set<string>()

  $('a[href*="action=edit_batt"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const idMatch = href.match(/[?&]name=(bt_\d+)/)
    if (!idMatch) return
    const id = idMatch[1]
    if (seen.has(id)) return

    // Row layout: td[0] "<n> Cells<br><cap> mAh", td[1] "<name><br><username>".
    const tds = $(el).closest('tr').find('td')
    const cellsCap = tds.eq(0).text()
    const capacityMatch = cellsCap.match(/([\d.,']+)\s*mAh/i)
    const cellsMatch = cellsCap.match(/(\d+)\s*(?:Cells|Zellen)/i)
    const name = firstLine(tds.eq(1).html() ?? '')

    seen.add(id)
    entries.push({
      id,
      name: name || id,
      capacity: capacityMatch ? Math.round(Number(capacityMatch[1].replace(/[.,']/g, ''))) : 0,
      cells: cellsMatch ? parseInt(cellsMatch[1]) : 0,
    })
  })

  return entries
}

// List phase — mirrors fetchAllFlightIds. Paginates the battery overview,
// collecting one BatteryInfo per battery id plus the session Sid from a "Details"
// href. Pure network, nothing persisted: the pack name/capacity/cells it reads
// exist only here and are carried in memory into the ParsedImport.
async function fetchAllBatteryInfos(
  cookie: string,
): Promise<{ batteries: BatteryInfo[]; sid: string }> {
  const all: BatteryInfo[] = []
  const seen = new Set<string>()
  let sid = ''
  let start = 0

  while (true) {
    // ?action=battlist defaults to the logged-in account — no Aid needed.
    const url = `${CLOUD_URL}?action=battlist&start=${start}`
    const res = await fetch(url, { headers: { Cookie: cookie } })
    const html = await res.text()

    if (!sid) {
      const sidMatch = html.match(/[?&]Sid=([A-Za-z0-9]+)/)
      if (sidMatch) sid = sidMatch[1]
    }

    const fresh = parseBatteryListHtml(html).filter((e) => !seen.has(e.id))
    if (fresh.length === 0) break
    for (const e of fresh) {
      seen.add(e.id)
      all.push(e)
    }
    start += PAGE_SIZE
    await sleep(FETCH_DELAY_MS)
  }

  return { batteries: all, sid }
}

// Download phase — mirrors downloadFlights. Fetches one flight-log CSV per
// battery id. Unlike the immutable per-flight pages, a pack's log grows every
// time it is reused, so these are always re-fetched (no skip-if-exists).
async function downloadBatteryLogs(
  ids: string[],
  cookie: string,
  destDir: string,
  sid: string,
): Promise<void> {
  fs.mkdirSync(destDir, { recursive: true })
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    console.log(`Downloading battery log ${id} (${i + 1} of ${ids.length})...`)
    if (i > 0) await sleep(FETCH_DELAY_MS)
    const url = `${BATTERY_LOG_URL}?view=-1&file=${id}&Sid=${sid}`
    const res = await fetch(url, { headers: { Cookie: cookie } })
    const csv = await res.text()
    fs.writeFileSync(path.join(destDir, batteryLogFileName(id)), csv, 'utf8')
  }
}

// -----------------------------------------------------------------
// CSV parsing
// -----------------------------------------------------------------

interface EventData {
  startDate: Date
  duration: number
  modelName: string
  minVoltage: number | undefined
  maxCurrent: number | undefined
}

function parseEventCsv(content: string): EventData | null {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l)
  if (lines.length === 0) return null

  // First line: "DD.MM.YYYY HH:MM:SS;VStabi Start -- MODEL -- ..."
  const firstSemi = lines[0].indexOf(';')
  if (firstSemi === -1) return null
  const startDate = parseGermanDate(lines[0].substring(0, firstSemi))
  if (isNaN(startDate.getTime())) return null

  // Model name from "VStabi Start -- NAME -- ..." (trailing fields optional in older firmware)
  const startMsg = lines[0].substring(firstSemi + 1)
  const afterStart = startMsg.split('VStabi Start -- ')[1]
  const modelName = afterStart ? (afterStart.split(' -- ')[0]?.trim() ?? 'Unknown') : 'Unknown'

  // End timestamp from the "VBar Logfile End" line (used as fallback for duration)
  let endDate = new Date(NaN)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('VBar Logfile End')) {
      const semi = lines[i].indexOf(';')
      endDate = parseGermanDate(lines[i].substring(0, semi))
      break
    }
  }

  // Min voltage and max current from "Aus - Regler" motor-off entries
  let minVoltage: number | undefined
  let maxCurrent: number | undefined
  for (const line of lines) {
    if (!line.includes('Aus - Regler')) continue
    const uminMatch = line.match(/Umin:([\d.]+)V/)
    const imaxMatch = line.match(/Imax:([\d.]+)A/)
    if (uminMatch) {
      const v = parseFloat(uminMatch[1])
      if (minVoltage === undefined || v < minVoltage) minVoltage = v
    }
    if (imaxMatch) {
      const a = parseFloat(imaxMatch[1])
      if (maxCurrent === undefined || a > maxCurrent) maxCurrent = a
    }
  }

  // Duration: sum of motor cycles.
  // Each cycle runs from "Motorschalter Motor An" + 1 s (the +1 accounts for the sub-second
  // delay between the preceding idle-spool event and actual throttle-active state, both of
  // which are logged at the same wall-clock second) to the next "Motorschalter Leerlauf
  // Durchstarten" (pilot moving throttle to idle before shutdown). This matches the duration
  // reported by the VBar Cloud UI.
  // Fallback: full log span (VStabi Start → VBar Logfile End) when no motor cycles are found.
  let totalDuration = 0
  let motorAnTime: Date | null = null
  for (const line of lines) {
    const semi = line.indexOf(';')
    if (semi === -1) continue
    const ts = parseGermanDate(line.substring(0, semi))
    if (isNaN(ts.getTime())) continue
    const msg = line.substring(semi + 1)
    if (msg.includes('Motorschalter Motor An')) {
      motorAnTime = new Date(ts.getTime() + 1000)
    } else if (msg.includes('Motorschalter Leerlauf Durchstarten') && motorAnTime !== null) {
      totalDuration += Math.max(0, Math.round((ts.getTime() - motorAnTime.getTime()) / 1000))
      motorAnTime = null
    }
  }
  if (totalDuration === 0 && !isNaN(endDate.getTime())) {
    totalDuration = Math.round((endDate.getTime() - startDate.getTime()) / 1000)
  }
  const duration = Math.max(5, totalDuration)

  return { startDate, duration, modelName, minVoltage, maxCurrent }
}

function parseTelemetryCsv(content: string): ParsedTelemetryPoint[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l)
  // First line is the header; data starts at index 1.
  // Multiple rows may share the same second — average them into one point per second.
  const buckets = new Map<number, ParsedTelemetryPoint[]>()
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';')
    if (parts.length < 7) continue
    const timestamp = parseGermanDate(parts[0] ?? '')
    const secondKey = Math.floor(timestamp.getTime() / 1000) * 1000
    const point: ParsedTelemetryPoint = {
      timestamp,
      current: parseFloat(parts[1] ?? '0') || 0,
      voltage: parseFloat(parts[2] ?? '0') || 0,
      chargeUsed: parseFloat(parts[3] ?? '0') || 0,
      headspeed: parseInt(parts[4] ?? '0') || 0,
      pwm: parseInt(parts[5] ?? '0') || 0,
      temp: parseFloat(parts[6] ?? '0') || 0,
    }
    const bucket = buckets.get(secondKey) ?? []
    bucket.push(point)
    buckets.set(secondKey, bucket)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([secondKey, points]) => {
      const avg = (fn: (p: ParsedTelemetryPoint) => number) =>
        Math.round((points.reduce((s, p) => s + fn(p), 0) / points.length) * 10) / 10
      return {
        timestamp: new Date(secondKey),
        current: avg((p) => p.current),
        voltage: avg((p) => p.voltage),
        chargeUsed: avg((p) => p.chargeUsed),
        headspeed: Math.round(points.reduce((s, p) => s + p.headspeed, 0) / points.length),
        pwm: Math.round(points.reduce((s, p) => s + p.pwm, 0) / points.length),
        temp: avg((p) => p.temp),
      }
    })
}

// -----------------------------------------------------------------
// Disk → ParsedImport
// -----------------------------------------------------------------

export function parseCsvFiles(rawDataPath: string): ParsedImport {
  const files = fs.readdirSync(rawDataPath)
  const eventFiles = files.filter((f) => /^F\d+_event\.csv$/.test(f))

  const flights: ParsedFlight[] = []
  const modelNames = new Set<string>()

  for (const eventFile of eventFiles) {
    const flightId = eventFile.replace('_event.csv', '')
    const eventContent = fs.readFileSync(path.join(rawDataPath, eventFile), 'utf8')
    const parsed = parseEventCsv(eventContent)
    if (!parsed) continue

    const { startDate, duration, modelName, minVoltage, maxCurrent } = parsed

    modelNames.add(modelName)

    // Parse telemetry if the file exists
    let telemetry: ParsedTelemetryPoint[] = []
    const telemetryPath = path.join(rawDataPath, `${flightId}_telemetry.csv`)
    if (fs.existsSync(telemetryPath)) {
      const telContent = fs.readFileSync(telemetryPath, 'utf8')
      telemetry = parseTelemetryCsv(telContent)
    }

    const chargeUsed = telemetry.length > 0 ? telemetry[telemetry.length - 1].chargeUsed : undefined
    const maxPower =
      telemetry.length > 0
        ? Math.round(Math.max(...telemetry.map((p) => p.current * p.voltage)) * 100) / 100
        : undefined
    const maxRPM = telemetry.length > 0 ? Math.max(...telemetry.map((p) => p.headspeed)) : undefined

    flights.push({
      date: startDate,
      duration,
      modelName,
      minVoltage,
      maxCurrent,
      maxPower,
      maxRPM,
      chargeUsed,
      telemetry,
      sourceId: flightId, // "F<flightno>" — join key for battery matching
    })
  }

  const models = Array.from(modelNames).map((name) => ({ name }))
  return { models, flights, batteries: [] }
}

// -----------------------------------------------------------------
// Battery flight-log parsing + flight matching
// -----------------------------------------------------------------

export interface ParsedBatteryWithFlights extends BatteryInfo {
  flightNos: number[]
}

// Collect the flightno of every row in a battery flight-log CSV. Rows are
// semicolon-separated with no header:
//   usedAt;cFull;cUsed;flightTime;uMin;iMax;uEmpty;batteryHwId;flightno;model
export function parseBatteryLogCsv(content: string): number[] {
  const nos = new Set<number>()
  for (const line of content.split('\n')) {
    const parts = line.split(';')
    if (parts.length < 9) continue
    const no = parseInt(parts[8])
    if (!isNaN(no)) nos.add(no)
  }
  return [...nos]
}

// Pair each in-memory BatteryInfo with the flightNos from its downloaded
// <bat-id>_log.csv on disk. Mirrors parseCsvFiles: reads only the saved CSVs.
export function readBatteryLogs(
  rawDataPath: string,
  infos: BatteryInfo[],
): ParsedBatteryWithFlights[] {
  return infos.map((info) => {
    const csvPath = path.join(rawDataPath, batteryLogFileName(info.id))
    const flightNos = fs.existsSync(csvPath)
      ? parseBatteryLogCsv(fs.readFileSync(csvPath, 'utf8'))
      : []
    return { ...info, flightNos }
  })
}

// Set flight.batteryName by joining flight.sourceId ("F<flightno>") against each
// battery's flightNos. Mutates the flights in place.
export function annotateFlightsWithBatteries(
  flights: ParsedFlight[],
  batteries: ParsedBatteryWithFlights[],
): void {
  const byFlightNo = new Map<number, string>()
  for (const battery of batteries) {
    for (const no of battery.flightNos) {
      const existing = byFlightNo.get(no)
      if (existing && existing !== battery.name) {
        console.warn(
          `vbar_v2: flight ${no} is claimed by batteries "${existing}" and "${battery.name}"; keeping "${existing}"`,
        )
        continue
      }
      byFlightNo.set(no, battery.name)
    }
  }

  for (const flight of flights) {
    const m = flight.sourceId?.match(/^F(\d+)$/)
    if (!m) continue
    const name = byFlightNo.get(parseInt(m[1]))
    if (name) flight.batteryName = name
  }
}

// -----------------------------------------------------------------
// Parser export
// -----------------------------------------------------------------

export const vbarV2Parser: ImportParser<VbarV2Options> = {
  async parse(rawDataPath: string, options: VbarV2Options): Promise<ParsedImport> {
    const { username, password } = options

    if (!username || !password) {
      throw new Error('vbar_v2 requires options.username and options.password')
    }

    // Download phase: login, fetch full flight list, download only flights missing on disk
    const cookie = await login(username, password)
    console.log('Login successful, session cookie obtained. Starting flight list retrieval...')
    const { flightIds, sid } = await fetchAllFlightIds(cookie)
    console.log(`Retrieved ${flightIds.length} flight IDs. Starting download of flight data...`)
    await downloadFlights(flightIds, cookie, rawDataPath, sid)

    const parsed = parseCsvFiles(rawDataPath)

    // Battery phase: overview list → per-battery flight-log CSV → flight links.
    // Pack metadata stays in memory (never written to disk).
    try {
      const { batteries: infos, sid: battSid } = await fetchAllBatteryInfos(cookie)
      console.log(`Retrieved ${infos.length} batteries. Downloading battery logs...`)
      await downloadBatteryLogs(
        infos.map((b) => b.id),
        cookie,
        rawDataPath,
        battSid || sid,
      )
      const batteries = readBatteryLogs(rawDataPath, infos)
      annotateFlightsWithBatteries(parsed.flights, batteries)
      parsed.batteries = batteries.map(({ name, capacity, cells }) => ({ name, capacity, cells }))
    } catch (e) {
      console.warn('vbar_v2: battery extraction failed, continuing without batteries', e)
    }

    return parsed
  },
}
