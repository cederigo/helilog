import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ImportRecord } from '../../lib/api'

interface ImportResultProps {
  result: ImportRecord
  onImportMore: () => void
}

export default function ImportResult({ result, onImportMore }: ImportResultProps) {
  const navigate = useNavigate()
  const { counts } = result

  const tiles = [
    { label: 'Flights', value: counts.flights },
    { label: 'Models', value: counts.models },
    { label: 'Batteries', value: counts.batteries },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-black tracking-tight">Import complete</h2>

      <div className="grid grid-cols-3 gap-4">
        {tiles.map(({ label, value }) => (
          <Card key={label} accent>
            <CardContent className="p-4 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                {label}
              </p>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {counts.flights === 0 && (
        <Alert>
          <AlertTitle>No new flights were added</AlertTitle>
          <AlertDescription>
            These logs may already have been imported — flights are matched by model and start time.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          className="tracking-widest uppercase text-xs"
          onClick={() => navigate('/')}
        >
          View flights
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="tracking-widest uppercase text-xs"
          onClick={onImportMore}
        >
          Import more
        </Button>
      </div>
    </div>
  )
}
