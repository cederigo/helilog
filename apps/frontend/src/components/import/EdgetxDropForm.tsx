import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { importApi } from '../../lib/api'
import type { ImportRecord } from '../../lib/api'
import { cn } from '@/lib/utils'
import ImportBusy from './ImportBusy'
import { dedupeByName, filesFromDataTransfer, isCsv, isEdgetxName } from './dropUtils'

interface EdgetxDropFormProps {
  onDone: (record: ImportRecord) => void
  onCancel: () => void
}

export default function EdgetxDropForm({ onDone, onCancel }: EdgetxDropFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: File[]) => {
    const csvs = incoming.filter((f) => isCsv(f.name))
    setFiles((prev) => dedupeByName([...prev, ...csvs]))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.set('format', 'edgetx')
      for (const file of files) form.append('files[]', file, file.name)
      return importApi.create(form)
    },
    onSuccess: onDone,
  })

  if (mutation.isPending) {
    return <ImportBusy message="Parsing your EdgeTX logs…" />
  }

  const skipped = files.filter((f) => !isEdgetxName(f.name))

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (files.length > 0) mutation.mutate()
      }}
    >
      <h2 className="text-lg font-black tracking-tight">Import EdgeTX logs</h2>

      {mutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}

      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-brand-sky bg-accent/10' : 'border-input',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          filesFromDataTransfer(e.dataTransfer).then(addFiles)
        }}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop CSV files or a <span className="font-semibold">logs</span> folder here
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose files
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => folderInputRef.current?.click()}
          >
            Choose folder
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {files.length} file{files.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFiles([])}
            >
              Clear all
            </button>
          </div>
          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-input p-2">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between gap-2 text-sm">
                <span
                  className={cn('truncate', !isEdgetxName(file.name) && 'text-muted-foreground')}
                >
                  {file.name}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setFiles((prev) => prev.filter((f) => f.name !== file.name))}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {skipped.length > 0 && (
        <Alert>
          <AlertDescription>
            {skipped.length} file{skipped.length === 1 ? '' : 's'} don&apos;t match the EdgeTX name
            pattern <code>&lt;model&gt;-YYYY-MM-DD-HHMMSS.csv</code> and will be skipped by the
            parser.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="tracking-widest uppercase text-xs"
          disabled={files.length === 0}
        >
          Import {files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'}` : ''}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
