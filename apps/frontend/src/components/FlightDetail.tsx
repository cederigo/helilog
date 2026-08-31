import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { flightApi, flightKeys } from '../lib/api'
import { formatDateTime, formatDuration, formatOptional } from '../lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TelemetryChart from './TelemetryChart'

export default function FlightDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const flightId = Number(id)

  const {
    data: flight,
    isPending,
    error,
  } = useQuery({
    queryKey: flightKeys.detail(flightId),
    queryFn: () => flightApi.getById(flightId),
  })

  if (isPending) return <p className="py-12 text-center text-muted-foreground">Loading flight…</p>
  if (error) return <p className="py-12 text-center text-brand-punch">Error: {error.message}</p>

  const rows: { label: string; value: string }[] = [
    { label: 'Date', value: formatDateTime(flight.date) },
    { label: 'Duration', value: formatDuration(flight.duration) },
    { label: 'Model', value: flight.model?.name ?? `Model #${flight.modelId}` },
    {
      label: 'Battery',
      value: flight.battery
        ? `${flight.battery.name} (${flight.battery.capacity} mAh · ${flight.battery.cells}S)`
        : '—',
    },
    { label: 'Max RPM', value: formatOptional(flight.maxRPM, (v) => `${v.toLocaleString()} rpm`) },
    { label: 'Max Power', value: formatOptional(flight.maxPower, (v) => `${v.toFixed(1)} W`) },
    { label: 'Max Current', value: formatOptional(flight.maxCurrent, (v) => `${v.toFixed(1)} A`) },
    { label: 'Min Voltage', value: formatOptional(flight.minVoltage, (v) => `${v.toFixed(2)} V`) },
    {
      label: 'Charge Used',
      value: formatOptional(flight.chargeUsed, (v) => `${Math.round(v)} mAh`),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <h1 className="text-2xl font-black tracking-tight">
          Flight{' '}
          <span className="text-lg font-normal text-muted-foreground pl-4">
            @ {formatDateTime(flight.date)}
          </span>
        </h1>
      </div>

      <Card>
        <CardHeader className="pb-8">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Flight Details
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
      <TelemetryChart flightId={flightId} />
    </div>
  )
}
