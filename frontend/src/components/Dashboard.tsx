import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statsApi, maintenanceApi } from '../lib/api'
import type { DashboardStats, Flight, MaintenanceAlert, WeeklyTrend, MonthlyTrend } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentFlights, setRecentFlights] = useState<Flight[]>([])
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsRes, recentRes, alertsRes, weeklyRes, monthlyRes] = await Promise.all([
        statsApi.getStats(),
        statsApi.getRecent(),
        maintenanceApi.getAlerts(),
        statsApi.getWeeklyTrends(),
        statsApi.getMonthlyTrends(),
      ])
      setStats(statsRes.data)
      setRecentFlights(recentRes.data)
      setMaintenanceAlerts(alertsRes.data.alerts || [])
      setWeeklyTrends(weeklyRes.data.weeks || [])
      setMonthlyTrends(monthlyRes.data.months || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Dashboard</h1>
        <div className="quick-actions">
          <button onClick={() => navigate('/flights/new')} className="btn-primary">
            Log Flight
          </button>
          <button onClick={() => navigate('/helicopters/new')} className="btn-secondary">
            Add Helicopter
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Flights</h3>
          <p className="stat-value">{stats?.totalFlights || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Hours</h3>
          <p className="stat-value">{stats?.totalHours.toFixed(2) || '0.00'}h</p>
        </div>

        <div className="stat-card">
          <h3>Average Duration</h3>
          <p className="stat-value">{stats?.averageDuration.toFixed(1) || '0.0'} min</p>
        </div>

        <div className="stat-card">
          <h3>Flights This Month</h3>
          <p className="stat-value">{stats?.flightsThisMonth || 0}</p>
        </div>
      </div>

      {stats?.mostFlownHelicopter && (
        <div className="most-flown-card">
          <h2>Most Flown</h2>
          <p>
            <strong>{stats.mostFlownHelicopter.name}</strong> ({stats.mostFlownHelicopter.model})
          </p>
          <p>{stats.mostFlownHelicopter.flightCount} flights</p>
        </div>
      )}

      {maintenanceAlerts.length > 0 && (
        <div className="maintenance-alerts-card">
          <h2>⚠️ Maintenance Alerts</h2>
          <div className="alerts-list">
            {maintenanceAlerts.map((alert) => (
              <div
                key={alert.helicopter.id}
                className={`alert-item ${alert.status}`}
                onClick={() => navigate(`/helicopters/${alert.helicopter.id}`)}
              >
                <div className="alert-header">
                  <strong>{alert.helicopter.name}</strong>
                  <span className={`status-badge ${alert.status}`}>
                    {alert.status === 'overdue' ? 'OVERDUE' : 'DUE SOON'}
                  </span>
                </div>
                <div className="alert-details">
                  <span>{alert.totalHours.toFixed(1)}h flown</span>
                  <span>•</span>
                  <span>Last maintenance: {alert.lastMaintenanceHours.toFixed(1)}h</span>
                  <span>•</span>
                  {alert.status === 'overdue' ? (
                    <span className="overdue-text">{alert.hoursOverdue.toFixed(1)}h overdue</span>
                  ) : (
                    <span>Due at {alert.nextDueAt.toFixed(1)}h</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="trends-section">
        <div className="trend-card">
          <h2>Weekly Flight Activity</h2>
          {weeklyTrends.length === 0 ? (
            <p className="no-data">Not enough data to show trends</p>
          ) : (
            <div className="trend-bars">
              {weeklyTrends.map((week, idx) => {
                const maxCount = Math.max(...weeklyTrends.map(w => w.count), 1)
                const percentage = (week.count / maxCount) * 100
                return (
                  <div key={idx} className="trend-bar-item">
                    <div className="bar-container">
                      <div className="bar" style={{ width: `${percentage}%` }}>
                        {week.count > 0 && <span className="bar-label">{week.count}</span>}
                      </div>
                    </div>
                    <div className="bar-date">
                      {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="trend-card">
          <h2>Monthly Flight Hours</h2>
          {monthlyTrends.length === 0 ? (
            <p className="no-data">Not enough data to show trends</p>
          ) : (
            <div className="trend-bars">
              {monthlyTrends.map((month, idx) => {
                const maxHours = Math.max(...monthlyTrends.map(m => m.hours), 1)
                const percentage = (month.hours / maxHours) * 100
                return (
                  <div key={idx} className="trend-bar-item">
                    <div className="bar-container">
                      <div className="bar" style={{ width: `${percentage}%` }}>
                        {month.hours > 0 && <span className="bar-label">{month.hours.toFixed(1)}h</span>}
                      </div>
                    </div>
                    <div className="bar-date">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="recent-flights-card">
        <div className="card-header">
          <h2>Recent Flights</h2>
          <button onClick={() => navigate('/flights')} className="btn-link">
            View All
          </button>
        </div>
        {recentFlights.length === 0 ? (
          <p>No recent flights</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Helicopter</th>
                <th>Duration</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {recentFlights.map((flight) => (
                <tr key={flight.id}>
                  <td>{new Date(flight.date).toLocaleDateString()}</td>
                  <td>{flight.helicopter?.name || `Heli #${flight.helicopterId}`}</td>
                  <td>{flight.duration} min</td>
                  <td>{flight.flightMode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
