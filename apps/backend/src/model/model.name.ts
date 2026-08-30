/**
 * Canonical key for comparing model names. Names that differ only by case,
 * whitespace, or punctuation collapse to the same key, so "Logo 700",
 * "Logo-700" and "logo700" are treated as the same model.
 */
export function normalizeModelName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}
