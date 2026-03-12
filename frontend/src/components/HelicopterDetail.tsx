import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { helicopterApi, maintenanceApi } from '../lib/api'
import type { Helicopter, Flight, MaintenanceRecord } from '../types'

export default function HelicopterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [helicopter, setHelicopter] = useState<Helicopter | null>(null)
  const [recentFlights, setRecentFlights] = useState<Flight[]>([])
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadHelicopter(parseInt(id))
  }, [id])

  const loadHelicopter = async (heliId: number) => {
    try {
      setLoading(true)
      const [heliResponse, maintenanceResponse] = await Promise.all([
        helicopterApi.getById(heliId),
        maintenanceApi.getForHelicopter(heliId),
      ])
      setHelicopter(heliResponse.data)
      setRecentFlights(heliResponse.data.flights || [])
      setMaintenanceHistory(maintenanceResponse.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load helicopter')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!helicopter) return <div className="error">Helicopter not found</div>

  return (
    <div className="helicopter-detail">
      <div className="header">
        <h1>{helicopter.name}</h1>
        <div className="actions">
          <button onClick={() => navigate(`/helicopters/${helicopter.id}/edit`)} className="btn-primary">
            Edit
          </button>
          <button onClick={() => navigate('/helicopters')} className="btn-secondary">
            Back to List
          </button>
        </div>
      </div>

      <div className="specs-card">
        <h2>Specifications</h2>
        <dl>
          <dt>Model</dt>
          <dd>{helicopter.model}</dd>
          
          {helicopter.manufacturer && (
            <>
              <dt>Manufacturer</dt>
              <dd>{helicopter.manufacturer}</dd>
            </>
          )}
          
          {helicopter.rotorDiameter && (
            <>
              <dt>Rotor Diameter</dt>
              <dd>{helicopter.rotorDiameter} mm</dd>
            </>
          )}
          
          {helicopter.weight && (
            <>
              <dt>Weight</dt>
              <dd>{helicopter.weight} kg</dd>
            </>
          )}
          
          <dt>Total Flight Hours</dt>
          <dd className="highlight">{helicopter.totalHours.toFixed(2)} hours</dd>
          
          {helicopter.maintenanceInterval && (
            <>
              <dt>Maintenance Interval</dt>
              <dd>{helicopter.maintenanceInterval} hours</dd>
            </>
          )}
        </dl>
      </div>

      <div className="recent-flights-card">
        <h2>Recent Flights</h2>
        {recentFlights.length === 0 ? (
          <p>No flights logged yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentFlights.map((flight) => (
                <tr key={flight.id}>
                  <td>{new Date(flight.date).toLocaleDateString()}</td>
                  <td>{flight.duration} min</td>
                  <td>{flight.flightMode || '-'}</td>
                  <td>{flight.notes?.substring(0, 50) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="recent-flights-card">
        <h2>Maintenance History</h2>
        {maintenanceHistory.length === 0 ? (
          <p>No maintenance records yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours at Maintenance</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceHistory.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.hoursAtMaintenance.toFixed(1)}h</td>
                  <td>{record.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
