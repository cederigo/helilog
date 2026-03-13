import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { flightApi } from '../lib/api'
import type { Flight } from '@helilog/shared'

export default function FlightList() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    helicopterId: '',
    startDate: '',
    endDate: '',
    flightMode: '',
    minDuration: '',
    maxDuration: '',
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadFlights()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFlights = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filters.helicopterId) params.helicopterId = filters.helicopterId
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      if (filters.flightMode) params.flightMode = filters.flightMode
      if (filters.minDuration) params.minDuration = filters.minDuration
      if (filters.maxDuration) params.maxDuration = filters.maxDuration

      const response = await flightApi.getAll(params)
      setFlights(response.data.flights || response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flights')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadFlights()
  }

  const handleClearFilters = () => {
    setFilters({
      helicopterId: '',
      startDate: '',
      endDate: '',
      flightMode: '',
      minDuration: '',
      maxDuration: '',
    })
    setTimeout(() => loadFlights(), 0)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this flight?')) return

    try {
      await flightApi.delete(id)
      loadFlights()
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err &&
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data
        ? String(err.response.data.error) : 'Failed to delete flight'
      alert(message)
    }
  }

  if (loading) return <div className="loading">Loading flights...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="flight-list">
      <div className="header">
        <h1>Flight History</h1>
        <button onClick={() => navigate('/flights/new')} className="btn-primary">
          Log Flight
        </button>
      </div>

      <form onSubmit={handleSearch} className="filters-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">From Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">To Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="flightMode">Flight Mode</label>
            <select
              id="flightMode"
              name="flightMode"
              value={filters.flightMode}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="3D">3D</option>
              <option value="Sport">Sport</option>
              <option value="GPS">GPS</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={handleClearFilters} className="btn-secondary">
            Clear
          </button>
        </div>
      </form>

      {flights.length === 0 ? (
        <div className="empty-state">
          <p>No flights logged yet</p>
          <button onClick={() => navigate('/flights/new')} className="btn-primary">
            Log Your First Flight
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Helicopter</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.id}>
                  <td>{new Date(flight.date).toLocaleDateString()}</td>
                  <td>{flight.helicopter?.name || `Heli #${flight.helicopterId}`}</td>
                  <td>{flight.duration} min</td>
                  <td>{flight.flightMode || '-'}</td>
                  <td>{flight.location || '-'}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/flights/${flight.id}/edit`)}
                      className="btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(flight.id)}
                      className="btn-small btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
