import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { helicopterApi } from '../lib/api'
import type { Helicopter } from '@helilog/shared'

export default function HelicopterList() {
  const [helicopters, setHelicopters] = useState<Helicopter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadHelicopters()
  }, [])

  const loadHelicopters = async () => {
    try {
      setLoading(true)
      const response = await helicopterApi.getAll()
      setHelicopters(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load helicopters')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete helicopter "${name}"?`)) return

    try {
      await helicopterApi.delete(id)
      loadHelicopters()
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data
        ? String(err.response.data.error) : 'Failed to delete helicopter'
      alert(message)
    }
  }

  if (loading) return <div className="loading">Loading helicopters...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="helicopter-list">
      <div className="header">
        <h1>My Helicopters</h1>
        <button onClick={() => navigate('/helicopters/new')} className="btn-primary">
          Add Helicopter
        </button>
      </div>

      {helicopters.length === 0 ? (
        <div className="empty-state">
          <p>No helicopters added yet</p>
          <button onClick={() => navigate('/helicopters/new')} className="btn-primary">
            Add Your First Helicopter
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>Manufacturer</th>
                <th>Total Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {helicopters.map((heli) => (
                <tr key={heli.id}>
                  <td>
                    <button
                      onClick={() => navigate(`/helicopters/${heli.id}`)}
                      className="link-button"
                    >
                      {heli.name}
                    </button>
                  </td>
                  <td>{heli.model}</td>
                  <td>{heli.manufacturer || '-'}</td>
                  <td>{heli.totalHours.toFixed(2)}h</td>
                  <td>
                    <button
                      onClick={() => navigate(`/helicopters/${heli.id}/edit`)}
                      className="btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(heli.id, heli.name)}
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
