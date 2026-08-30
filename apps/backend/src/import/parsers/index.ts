import type { Parsers } from '../import.types'
import { edgetxParser } from './edgetx'
import { vbarV2Parser } from './vbar_v2'

export { AuthError } from './vbar_v2'

export const parsers: Parsers = {
  vbar_v2: vbarV2Parser,
  edgetx: edgetxParser,
}
