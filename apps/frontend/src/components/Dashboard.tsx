import { useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { statsApi, statsKeys } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FlightTable from './FlightTable'

export default function Dashboard() {
  const navigate = useNavigate()

  const [statsQuery, recentQuery] = useQueries({
    queries: [
      { queryKey: statsKeys.overview, queryFn: statsApi.getStats },
      { queryKey: statsKeys.recent, queryFn: statsApi.getRecent },
    ],
  })

  const isPending = [statsQuery, recentQuery].some((q) => q.isPending)
  const error = [statsQuery, recentQuery].find((q) => q.error)?.error

  if (isPending)
    return <p className="py-12 text-center text-muted-foreground">Loading dashboard…</p>
  if (error) return <p className="py-12 text-center text-brand-punch">Error: {error.message}</p>

  const stats = statsQuery.data
  const recentFlights = recentQuery.data ?? []

  const statCards = [
    { label: 'Total Flights', value: stats?.totalFlights ?? 0 },
    { label: 'Total Hours', value: `${stats?.totalHours.toFixed(2) ?? '0.00'}h` },
    { label: 'Avg Duration', value: `${((stats?.averageDuration ?? 0) / 60).toFixed(1)} min` },
    { label: 'Flights This Month', value: stats?.flightsThisMonth ?? 0 },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="tracking-widest uppercase text-xs"
            onClick={() => navigate('/models/new')}
          >
            Log flight
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value }) => (
          <Card key={label} accent>
            <CardContent className="p-4 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                {label}
              </p>
              <p className="text-xl font-bold ">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Most Flown */}
      {stats?.topModels && stats.topModels.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Most Flown (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 flex flex-col gap-2">
            {stats.topModels.map((model, i) => (
              <div key={model.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                  <span
                    className="text-sm font-medium text-brand-sky hover:underline cursor-pointer"
                    onClick={() => navigate(`/models/${model.id}`)}
                  >
                    {model.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{model.flightCount} flights</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Flights */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Flights
            </CardTitle>
            <span
              className="text-xs text-brand-sky hover:underline cursor-pointer"
              onClick={() => navigate('/flights')}
            >
              View All
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentFlights.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No recent flights</p>
          ) : (
            <FlightTable flights={recentFlights} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
