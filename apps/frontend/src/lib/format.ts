export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function formatOptional<T>(val: T | null | undefined, fmt: (v: T) => string): string {
  return val == null ? '—' : fmt(val)
}
