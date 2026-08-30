import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { importApi } from '../../lib/api'
import type { ImportRecord } from '../../lib/api'
import SourcePicker from './SourcePicker'
import ManualFlightForm from './ManualFlightForm'
import EdgetxDropForm from './EdgetxDropForm'
import VbarCredentialsForm, { type VbarCredentials } from './VbarCredentialsForm'
import ImportResult from './ImportResult'
import ImportHistory from './ImportHistory'
import { invalidateImportData } from './invalidate'

/** Layout for `/import/*`: shared header + the active step via <Outlet />. */
export default function ImportFlight() {
  const navigate = useNavigate()
  const atStart = useLocation().pathname === '/import'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (atStart ? navigate(-1) : navigate('/import'))}
        >
          ← Back
        </Button>
        <h1 className="text-2xl font-black tracking-tight">Log flight</h1>
      </div>

      <Outlet />
    </div>
  )
}

/** Invalidate caches and jump to the result screen, carrying the record in history state. */
function useFinishImport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return (result: ImportRecord) => {
    invalidateImportData(queryClient)
    navigate('/import/result', { state: { result } })
  }
}

export function ImportChooser() {
  const navigate = useNavigate()
  return (
    <>
      <SourcePicker onSelect={(source) => navigate(`/import/${source}`)} />
      <ImportHistory />
    </>
  )
}

export function ManualImport() {
  const navigate = useNavigate()
  return <ManualFlightForm onBack={() => navigate('/import')} />
}

export function EdgetxImport() {
  const navigate = useNavigate()
  const finish = useFinishImport()
  return <EdgetxDropForm onDone={finish} onCancel={() => navigate('/import')} />
}

export function VbarImport() {
  const navigate = useNavigate()
  const finish = useFinishImport()

  const importVbar = (creds: VbarCredentials) => {
    const form = new FormData()
    form.set('format', 'vbar_v2')
    form.set('options', JSON.stringify({ username: creds.username, password: creds.password }))
    if (creds.description) form.set('description', creds.description)
    return importApi.create(form)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-black tracking-tight">Import from VBar Cloud</h2>
      <VbarCredentialsForm
        submitLabel="Import"
        showDescription
        onSubmit={importVbar}
        onDone={finish}
        onCancel={() => navigate('/import')}
      />
    </div>
  )
}

export function ImportComplete() {
  const navigate = useNavigate()
  const result = (useLocation().state as { result?: ImportRecord } | null)?.result
  if (!result) return <Navigate to="/import" replace />
  return <ImportResult result={result} onImportMore={() => navigate('/import')} />
}
