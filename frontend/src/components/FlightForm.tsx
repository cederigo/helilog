import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { flightApi, helicopterApi } from '../lib/api'
import { createFlightSchema } from '@helilog/shared'
import type { Helicopter } from '@helilog/shared'

const frontendCreateFlightSchema = createFlightSchema.extend({
  date: z.string().min(1, 'Date is required'),
})

type FlightFormValues = z.infer<typeof frontendCreateFlightSchema>

export default function FlightForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const [helicopters, setHelicopters] = useState<Helicopter[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditMode)

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

  useEffect(() => {
    loadHelicopters()
    if (isEditMode && id) {
      loadFlight(parseInt(id))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode])

  const loadHelicopters = async () => {
    try {
      const response = await helicopterApi.getAll()
      setHelicopters(response.data)
    } catch {
      alert('Failed to load helicopters')
    }
  }

  const loadFlight = async (flightId: number) => {
    try {
      setLoading(true)
      const response = await flightApi.getById(flightId)
      const flight = response.data
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
    } catch {
      alert('Failed to load flight')
      navigate('/flights')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FlightFormValues) => {
    try {
      setSubmitting(true)
      const payload = { ...data, date: new Date(data.date).toISOString() }
      if (isEditMode && id) {
        await flightApi.update(parseInt(id), payload)
      } else {
        await flightApi.create(payload)
      }
      navigate('/flights')
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err &&
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data
        ? String(err.response.data.error) : `Failed to ${isEditMode ? 'update' : 'create'} flight`
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  if (helicopters.length === 0 && !loading) {
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

      <form onSubmit={handleSubmit(onSubmit)}>
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
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (isEditMode ? 'Updating...' : 'Logging...') : (isEditMode ? 'Update Flight' : 'Log Flight')}
          </button>
        </div>
      </form>
    </div>
  )
}
