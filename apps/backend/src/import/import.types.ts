export interface ParsedModel {
  name: string
}

export interface ParsedTelemetryPoint {
  timestamp: Date
  current: number // A
  voltage: number // V
  chargeUsed: number // mAh consumed
  headspeed: number // RPM
  pwm: number // throttle %
  temp: number // °C
}

export interface ParsedFlight {
  date: Date
  duration: number // seconds
  modelName: string // links to ParsedModel.name
  minVoltage?: number
  maxCurrent?: number
  maxPower?: number
  maxRPM?: number
  chargeUsed?: number
  telemetry: ParsedTelemetryPoint[]
}

export interface ParsedBattery {
  name: string
  capacity: number // mAh
  cells?: number
}

export interface ParsedImport {
  models: ParsedModel[]
  flights: ParsedFlight[]
  batteries: ParsedBattery[]
}

// Per-parser options types
export interface VbarV2Options {
  username: string
  password: string
}

// Map format key → its concrete options type
export interface ParserOptionsMap {
  vbar_v2: VbarV2Options
}

export interface ImportParser<TOptions = Record<string, never>> {
  parse(rawDataPath: string, options: TOptions): Promise<ParsedImport>
}

// Fully-typed parsers registry
export type Parsers = { [K in keyof ParserOptionsMap]: ImportParser<ParserOptionsMap[K]> }
