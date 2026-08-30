import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { flightApi, modelApi, modelKeys } from '../../lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeModelName } from './dropUtils'

interface ManualFlightFormProps {
  onBack: () => void
}

async function resolveModelId(name: string): Promise<number> {
  const models = await modelApi.getAll()
  const key = normalizeModelName(name)
  const existing = models.find((m) => normalizeModelName(m.name) === key)
  if (existing) return existing.id
  const created = await modelApi.create({ name: name.trim() })
  return created.id
}

export default function ManualFlightForm({ onBack }: ManualFlightFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const modelsQuery = useQuery({ queryKey: modelKeys.all, queryFn: modelApi.getAll })

  const [model, setModel] = useState('')
  const [date, setDate] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')

  const durationSeconds = Math.round((Number(minutes) || 0) * 60 + (Number(seconds) || 0))
  const canSubmit = model.trim().length > 0 && date.length > 0 && durationSeconds > 0

  const mutation = useMutation({
    mutationFn: async () => {
      const modelId = await resolveModelId(model)
      return flightApi.create({
        modelId,
        date: new Date(date).toISOString(),
        duration: durationSeconds,
      })
    },
    onSuccess: (flight) => {
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      queryClient.invalidateQueries({ queryKey: ['models'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/flights/${flight.id}`)
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) mutation.mutate()
      }}
    >
      <h2 className="text-lg font-black tracking-tight">Log a flight manually</h2>

      {mutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              list="known-models"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Logo 700"
              autoComplete="off"
            />
            <datalist id="known-models">
              {(modelsQuery.data ?? []).map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick an existing model or type a new name to create it.
            </p>
          </div>

          <div>
            <Label htmlFor="date">Date &amp; time</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Duration</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="min"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">min</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="sec"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">sec</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="tracking-widest uppercase text-xs"
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Log flight'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onBack}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
