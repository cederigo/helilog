import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { flightApi, helicopterApi } from '../lib/api'
import type { Helicopter } from '../types'

interface FormData {
  helicopterId: string
  date: string
  duration: string
  batteryCycles: string
  flightMode: string
  weather: string
  temperature: string
  windSpeed: string
  location: string
  notes: string
}

export default function FlightForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const [helicopters, setHelicopters] = useState<Helicopter[]>([])
  const [formData, setFormData] = useState<FormData>({
    helicopterId: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    batteryCycles: '',
    flightMode: '',
    weather: '',
    temperature: '',
    windSpeed: '',
    location: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditMode)

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
      setFormData({
        helicopterId: flight.helicopterId.toString(),
        date: flight.date.split('T')[0],
        duration: flight.duration.toString(),
        batteryCycles: flight.batteryCycles?.toString() || '',
        flightMode: flight.flightMode || '',
        weather: flight.weather || '',
        temperature: flight.temperature?.toString() || '',
        windSpeed: flight.windSpeed?.toString() || '',
        location: flight.location || '',
        notes: flight.notes || '',
      })
    } catch {
      alert('Failed to load flight')
      navigate('/flights')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.helicopterId) newErrors.helicopterId = 'Helicopter is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.duration) {
      newErrors.duration = 'Duration is required'
    } else if (parseFloat(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be positive'
    }
    
    if (formData.batteryCycles && parseInt(formData.batteryCycles) < 0) {
      newErrors.batteryCycles = 'Cannot be negative'
    }
    if (formData.windSpeed && parseFloat(formData.windSpeed) < 0) {
      newErrors.windSpeed = 'Cannot be negative'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    try {
      setSubmitting(true)
      
      const payload: Record<string, unknown> = {
        helicopterId: parseInt(formData.helicopterId),
        date: new Date(formData.date).toISOString(),
        duration: parseFloat(formData.duration),
      }
      
      if (formData.batteryCycles) payload.batteryCycles = parseInt(formData.batteryCycles)
      if (formData.flightMode) payload.flightMode = formData.flightMode
      if (formData.weather) payload.weather = formData.weather.trim()
      if (formData.temperature) payload.temperature = parseFloat(formData.temperature)
      if (formData.windSpeed) payload.windSpeed = parseFloat(formData.windSpeed)
      if (formData.location) payload.location = formData.location.trim()
      if (formData.notes) payload.notes = formData.notes.trim()
      
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
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="helicopterId">Helicopter *</label>
          <select
            id="helicopterId"
            name="helicopterId"
            value={formData.helicopterId}
            onChange={handleChange}
            className={errors.helicopterId ? 'error' : ''}
          >
            <option value="">Select helicopter</option>
            {helicopters.map((heli) => (
              <option key={heli.id} value={heli.id}>
                {heli.name} ({heli.model})
              </option>
            ))}
          </select>
          {errors.helicopterId && <span className="error-message">{errors.helicopterId}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <input
              type="number"
              step="0.1"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={errors.duration ? 'error' : ''}
            />
            {errors.duration && <span className="error-message">{errors.duration}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="flightMode">Flight Mode</label>
            <select
              id="flightMode"
              name="flightMode"
              value={formData.flightMode}
              onChange={handleChange}
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
              name="batteryCycles"
              value={formData.batteryCycles}
              onChange={handleChange}
              className={errors.batteryCycles ? 'error' : ''}
            />
            {errors.batteryCycles && <span className="error-message">{errors.batteryCycles}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Flying field, Park"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="weather">Weather</label>
            <input
              type="text"
              id="weather"
              name="weather"
              value={formData.weather}
              onChange={handleChange}
              placeholder="e.g. Sunny, Cloudy"
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="windSpeed">Wind Speed (km/h)</label>
            <input
              type="number"
              step="0.1"
              id="windSpeed"
              name="windSpeed"
              value={formData.windSpeed}
              onChange={handleChange}
              className={errors.windSpeed ? 'error' : ''}
            />
            {errors.windSpeed && <span className="error-message">{errors.windSpeed}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
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
