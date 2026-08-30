// Utilities for the EdgeTX drop zone and the manual flight form.

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    // Non-standard, Chromium/WebKit only — lets a file input pick a whole folder.
    webkitdirectory?: string
  }
}

// EdgeTX writes "<MODEL NAME>-YYYY-MM-DD-HHMMSS.csv". The backend parser skips any
// file that does not match this, so we warn about them up front.
const EDGETX_NAME_RE = /^.+-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/i

export function isCsv(name: string): boolean {
  return /\.csv$/i.test(name)
}

export function isEdgetxName(name: string): boolean {
  return EDGETX_NAME_RE.test(name)
}

export function dedupeByName(files: File[]): File[] {
  const seen = new Set<string>()
  const out: File[] = []
  for (const file of files) {
    if (seen.has(file.name)) continue
    seen.add(file.name)
    out.push(file)
  }
  return out
}

type FileSystemEntry = {
  isFile: boolean
  isDirectory: boolean
  file(onSuccess: (file: File) => void, onError?: (err: unknown) => void): void
  createReader(): {
    readEntries(
      onSuccess: (entries: FileSystemEntry[]) => void,
      onError?: (err: unknown) => void,
    ): void
  }
}

function readEntryFile(entry: FileSystemEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

function readAllDirEntries(entry: FileSystemEntry): Promise<FileSystemEntry[]> {
  const reader = entry.createReader()
  const all: FileSystemEntry[] = []
  return new Promise((resolve, reject) => {
    const readBatch = () => {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve(all)
          return
        }
        all.push(...entries)
        readBatch()
      }, reject)
    }
    readBatch()
  })
}

async function collectFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const file = await readEntryFile(entry)
    return isCsv(file.name) ? [file] : []
  }
  if (entry.isDirectory) {
    const children = await readAllDirEntries(entry)
    const nested = await Promise.all(children.map(collectFromEntry))
    return nested.flat()
  }
  return []
}

// Pull every .csv out of a drop, recursing into any dropped folders.
export async function filesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const items = Array.from(dt.items).filter((i) => i.kind === 'file')
  const entries = items
    .map((i) => (i.webkitGetAsEntry?.() as FileSystemEntry | null) ?? null)
    .filter((e): e is FileSystemEntry => e !== null)

  if (entries.length > 0) {
    const collected = await Promise.all(entries.map(collectFromEntry))
    return dedupeByName(collected.flat())
  }

  // Fallback: no entry API (older browsers) — use the flat file list.
  return dedupeByName(Array.from(dt.files).filter((f) => isCsv(f.name)))
}

// Canonical key for comparing model names — mirrors the backend's
// normalizeModelName (apps/backend/src/model/model.name.ts).
export function normalizeModelName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}
