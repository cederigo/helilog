import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flightApi, flightKeys, type FlightQueryInput } from '../lib/api'

const emptyFilters: FlightQueryInput = {}

export default function FlightList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [appliedFilters, setAppliedFilters] = useState<Partial<FlightQueryInput>>(emptyFilters)
  const [draftFilters, setDraftFilters] = useState<FlightQueryInput>(emptyFilters)

  const { data, isPending, error } = useQuery({
    queryKey: flightKeys.all(appliedFilters),
    queryFn: () => flightApi.getAll(appliedFilters),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => flightApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flights'] }),
    onError: (err) => alert(err.message),
  })

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setDraftFilters(prev => ({ ...prev, [name]: value || undefined }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedFilters(draftFilters)
  }

  const handleClearFilters = () => {
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  const handleDelete = (id: number) => {
    if (!confirm('Delete this flight?')) return
    deleteMutation.mutate(id)
  }

  if (isPending) return <div className="loading">Loading flights...</div>
  if (error) return <div className="error">Error: {error.message}</div>

  const flights = data.flights

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
              value={draftFilters.startDate ?? ''}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">To Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={draftFilters.endDate ?? ''}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="flightMode">Flight Mode</label>
            <select
              id="flightMode"
              name="flightMode"
              value={draftFilters.flightMode ?? ''}
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
