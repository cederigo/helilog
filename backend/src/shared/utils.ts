type SerializeDates<T> =
  T extends Date ? string :
  T extends (infer U)[] ? SerializeDates<U>[] :
  T extends object ? { [K in keyof T]: SerializeDates<T[K]> } :
  T

/**
 * Recursively converts all Date instances in an object to ISO strings.
 * Used at the Prisma repository boundary to produce JSON-compatible domain types.
 */
export function serializeDates<T>(value: T): SerializeDates<T> {
  if (value instanceof Date) return value.toISOString() as SerializeDates<T>
  if (Array.isArray(value)) return value.map(serializeDates) as SerializeDates<T>
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeDates(v)])
    ) as SerializeDates<T>
  }
  return value as SerializeDates<T>
}
