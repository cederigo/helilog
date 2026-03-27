import { useNavigate } from 'react-router-dom'
import type { flightApi } from '../lib/api'
import { formatDateTime, formatDuration, formatOptional } from '../lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type FlightRow = Awaited<ReturnType<typeof flightApi.getAll>>['flights'][number]

interface FlightTableProps {
  flights: FlightRow[]
  hideModel?: boolean
}

export default function FlightTable({ flights, hideModel = false }: FlightTableProps) {
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs uppercase tracking-widest">Date</TableHead>
          {!hideModel && <TableHead className="text-xs uppercase tracking-widest">Model</TableHead>}
          <TableHead className="text-xs uppercase tracking-widest">Duration</TableHead>
          <TableHead className="text-xs uppercase tracking-widest">Max RPM</TableHead>
          <TableHead className="text-xs uppercase tracking-widest">Max Power</TableHead>
          <TableHead className="text-xs uppercase tracking-widest">Charge Used</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flights.map((flight) => (
          <TableRow
            key={flight.id}
            className="cursor-pointer"
            onClick={() => navigate(`/flights/${flight.id}`)}
          >
            <TableCell className="text-sm tabular-nums">{formatDateTime(flight.date)}</TableCell>
            {!hideModel && (
              <TableCell
                className="text-sm text-brand-sky hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/models/${flight.modelId}`)
                }}
              >
                {flight.model?.name ?? `Model #${flight.modelId}`}
              </TableCell>
            )}
            <TableCell className="text-sm tabular-nums">
              {formatDuration(flight.duration)}
            </TableCell>
            <TableCell className="text-sm tabular-nums text-muted-foreground">
              {formatOptional(flight.maxRPM, (v) => `${v.toLocaleString()} rpm`)}
            </TableCell>
            <TableCell className="text-sm tabular-nums text-muted-foreground">
              {formatOptional(flight.maxPower, (v) => `${v.toFixed(1)} W`)}
            </TableCell>
            <TableCell className="text-sm tabular-nums text-muted-foreground">
              {formatOptional(flight.chargeUsed, (v) => `${Math.round(v)} mAh`)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
