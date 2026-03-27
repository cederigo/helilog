import { useParams, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { modelApi, modelKeys, flightApi, flightKeys } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FlightTable from './FlightTable'

export default function ModelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const modelId = Number(id)

  const [modelQuery, flightsQuery] = useQueries({
    queries: [
      { queryKey: modelKeys.detail(modelId), queryFn: () => modelApi.getById(modelId) },
      {
        queryKey: flightKeys.all({ modelId: String(modelId) }),
        queryFn: () => flightApi.getAll({ modelId: String(modelId) }),
      },
    ],
  })

  const isPending = [modelQuery, flightsQuery].some((q) => q.isPending)
  const error = [modelQuery, flightsQuery].find((q) => q.error)?.error
  const model = modelQuery.data
  const flightsData = flightsQuery.data

  if (isPending) return <p className="py-12 text-center text-muted-foreground">Loading…</p>
  if (error) return <p className="py-12 text-center text-brand-punch">Error: {error.message}</p>
  if (!model) return null

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: model.name },
    {
      label: 'Maintenance Interval',
      value: model.maintenanceInterval != null ? `${model.maintenanceInterval} h` : '—',
    },
    {
      label: 'Last Maintenance',
      value:
        model.lastMaintenance != null ? new Date(model.lastMaintenance).toLocaleDateString() : '—',
    },
  ]

  const flights = flightsData?.flights ?? []

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <h1 className="text-2xl font-black tracking-tight">{model.name}</h1>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Model Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            {rows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
                  {label}
                </dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {flights.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No flights logged</p>
          ) : (
            <FlightTable flights={flights} hideModel />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
