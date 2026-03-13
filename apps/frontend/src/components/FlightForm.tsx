import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flightApi, helicopterApi, flightKeys, helicopterKeys } from '../lib/api'
import { createFlightSchema } from '@helilog/shared'

const frontendCreateFlightSchema = createFlightSchema.extend({
  date: z.string().min(1, 'Date is required'),
})

type FlightFormValues = z.infer<typeof frontendCreateFlightSchema>

export default function FlightForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FlightFormValues>({
    resolver: zodResolver(frontendCreateFlightSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  })

  const { data: helicopters } = useQuery({
    queryKey: helicopterKeys.all,
    queryFn: helicopterApi.getAll,
  })

  const { isPending: loadingFlight } = useQuery({
    queryKey: flightKeys.detail(parseInt(id!)),
    queryFn: () => flightApi.getById(parseInt(id!)),
    enabled: isEditMode,
    staleTime: Infinity,
    select: (flight) => {
      reset({
        helicopterId: flight.helicopterId,
        date: flight.date.split('T')[0],
        duration: flight.duration,
        batteryCycles: flight.batteryCycles ?? undefined,
        flightMode: (flight.flightMode as FlightFormValues['flightMode']) ?? undefined,
        weather: flight.weather ?? undefined,
        temperature: flight.temperature ?? undefined,
        windSpeed: flight.windSpeed ?? undefined,
        location: flight.location ?? undefined,
        notes: flight.notes ?? undefined,
      })
      return flight
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FlightFormValues) => {
      const payload = { ...data, date: new Date(data.date).toISOString() }
      if (isEditMode && id) {
        return flightApi.update(parseInt(id), payload)
      }
      return flightApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      navigate('/flights')
    },
    onError: (err) => alert(err.message),
  })

  if (isEditMode && loadingFlight) return <div className="loading">Loading...</div>

  if (!helicopters?.length) {
    return (
      <div className="empty-state">
        <h1>{isEditMode ? 'Edit Flight' : 'Log Flight'}</h1>
        <p>No helicopters available. Please add a helicopter first.</p>
        <button onClick={() => navigate('/helicopters/new')} className="btn-primary">
          Add Helicopter
        </button>
      </div>
    )
  }

  return (
    <div className="flight-form">
      <h1>{isEditMode ? 'Edit Flight' : 'Log Flight'}</h1>

      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))}>
        <div className="form-group">
          <label htmlFor="helicopterId">Helicopter *</label>
          <select
            id="helicopterId"
            {...register('helicopterId', { valueAsNumber: true })}
            className={errors.helicopterId ? 'error' : ''}
          >
            <option value="">Select helicopter</option>
            {helicopters.map((heli) => (
              <option key={heli.id} value={heli.id}>
                {heli.name} ({heli.model})
              </option>
            ))}
          </select>
          {errors.helicopterId && <span className="error-message">{errors.helicopterId.message}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              {...register('date')}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <input
              type="number"
              step="0.1"
              id="duration"
              {...register('duration', { valueAsNumber: true })}
              className={errors.duration ? 'error' : ''}
            />
            {errors.duration && <span className="error-message">{errors.duration.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="flightMode">Flight Mode</label>
            <select
              id="flightMode"
              {...register('flightMode')}
            >
              <option value="">Select mode</option>
              <option value="3D">3D</option>
              <option value="Sport">Sport</option>
              <option value="GPS">GPS</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="batteryCycles">Battery Cycles</label>
            <input
              type="number"
              id="batteryCycles"
              {...register('batteryCycles', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
              className={errors.batteryCycles ? 'error' : ''}
            />
            {errors.batteryCycles && <span className="error-message">{errors.batteryCycles.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            {...register('location')}
            placeholder="e.g. Flying field, Park"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="weather">Weather</label>
            <input
              type="text"
              id="weather"
              {...register('weather')}
              placeholder="e.g. Sunny, Cloudy"
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              id="temperature"
              {...register('temperature', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="windSpeed">Wind Speed (km/h)</label>
            <input
              type="number"
              step="0.1"
              id="windSpeed"
              {...register('windSpeed', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
              className={errors.windSpeed ? 'error' : ''}
            />
            {errors.windSpeed && <span className="error-message">{errors.windSpeed.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            placeholder="Any notes about the flight..."
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/flights')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? (isEditMode ? 'Updating...' : 'Logging...') : (isEditMode ? 'Update Flight' : 'Log Flight')}
          </button>
        </div>
      </form>
    </div>
  )
}
