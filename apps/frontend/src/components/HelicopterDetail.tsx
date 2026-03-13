import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { helicopterApi, maintenanceApi, helicopterKeys, maintenanceKeys } from '../lib/api'

export default function HelicopterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const heliId = parseInt(id!)

  const { data: helicopter, isPending, error } = useQuery({
    queryKey: helicopterKeys.detail(heliId),
    queryFn: () => helicopterApi.getById(heliId),
    enabled: Boolean(id),
  })

  const { data: maintenanceHistory } = useQuery({
    queryKey: maintenanceKeys.forHelicopter(heliId),
    queryFn: () => maintenanceApi.getForHelicopter(heliId),
    enabled: Boolean(id),
  })

  if (isPending) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error.message}</div>
  if (!helicopter) return <div className="error">Helicopter not found</div>

  const recentFlights = helicopter.flights ?? []
  const maintenance = maintenanceHistory ?? []

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
        {maintenance.length === 0 ? (
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
              {maintenance.map((record) => (
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
