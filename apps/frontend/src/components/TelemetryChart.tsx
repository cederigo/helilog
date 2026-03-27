import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { flightApi, flightKeys } from '../lib/api'

type FlightTelemetryPoint = Awaited<ReturnType<typeof flightApi.getTelemetry>>[number]

interface TelemetryChartProps {
  flightId: number
}

type NumericTelemetryKey = {
  [K in keyof FlightTelemetryPoint]: FlightTelemetryPoint[K] extends number ? K : never
}[keyof FlightTelemetryPoint]

interface SeriesConfig {
  name: string
  key: NumericTelemetryKey
  color: string
}

const SERIES_CONFIG: SeriesConfig[] = [
  { name: 'Current (A)', key: 'current', color: '#f97316' },
  { name: 'Headspeed (RPM)', key: 'headspeed', color: '#22c55e' },
  { name: 'Voltage (V)', key: 'voltage', color: '#3b82f6' },
  { name: 'Temp (°C)', key: 'temp', color: '#ef4444' },
  { name: 'PWM (%)', key: 'pwm', color: '#a855f7' },
  { name: 'Charge Used (mAh)', key: 'chargeUsed', color: '#eab308' },
]

function buildOption(points: FlightTelemetryPoint[], textColor: string) {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
    },
    legend: {
      type: 'plain',
      top: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
      textStyle: { color: textColor },
    },
    grid: {
      left: 16,
      right: 16,
      top: 40,
      bottom: 64,
    },
    xAxis: {
      type: 'time',
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor } },
      axisTick: { lineStyle: { color: textColor } },
    },
    // One hidden y-axis per series so each is independently auto-scaled
    yAxis: SERIES_CONFIG.map(() => ({
      type: 'value',
      show: false,
    })),
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 8 },
    ],
    series: SERIES_CONFIG.map((s, i) => ({
      name: s.name,
      type: 'line',
      yAxisIndex: i,
      showSymbol: false,
      sampling: 'lttb',
      large: true,
      itemStyle: { color: s.color },
      lineStyle: { color: s.color },
      data: points.map((p) => [p.timestamp, p[s.key]]),
    })),
  }
}

export default function TelemetryChart({ flightId }: TelemetryChartProps) {
  const {
    data: points,
    isPending,
    error,
  } = useQuery({
    queryKey: flightKeys.telemetry(flightId),
    queryFn: () => flightApi.getTelemetry(flightId),
  })

  if (isPending)
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading telemetry…</p>
  if (error) return null
  if (!points || points.length === 0) return null

  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-muted-foreground')
    .trim()

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Telemetry
        </CardTitle>
      </CardHeader>
      <CardContent className="pr-2">
        <ReactECharts option={buildOption(points, textColor)} style={{ height: 420 }} />
      </CardContent>
    </Card>
  )
}
