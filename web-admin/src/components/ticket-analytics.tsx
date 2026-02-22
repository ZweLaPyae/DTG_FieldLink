"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { Loader2, AlertTriangle } from "lucide-react"

interface DashboardData {
  weeklyData: Array<{
    day: string
    unresolved: number
  }>
  rootCauseData: Array<{
    name: string
    value: number
    count: number
  }>
  resolutionTimeData: Array<{
    day: string
    avgTime: number | null
    ticketCount: number
  }>
}

// More pleasing color palette for pie chart
const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
]

export function TicketAnalytics() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/dashboard`,
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Dashboard</CardTitle>
          <CardDescription>{error || 'Failed to load dashboard data'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Ticket Volume */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Unresolved Tickets</CardTitle>
          <CardDescription>Total number of unresolved tickets over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
                itemStyle={{
                  color: "hsl(var(--card-foreground))",
                }}
                labelStyle={{
                  color: "hsl(var(--card-foreground))",
                  fontWeight: "600",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="unresolved"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 5 }}
                activeDot={{ r: 7 }}
                name="Unresolved Tickets"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Root Cause Analysis */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Root Cause Analysis</CardTitle>
          <CardDescription>Distribution of ticket root causes this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
                itemStyle={{
                  color: "hsl(var(--card-foreground))",
                }}
                labelStyle={{
                  color: "hsl(var(--card-foreground))",
                  fontWeight: "600",
                }}
              />
              <Legend />
              <Pie
                data={data.rootCauseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={(entry) => `${entry.value}%`}
              >
                {data.rootCauseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.rootCauseData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-muted-foreground">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Time by Day */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle>Average Resolution Time by Day</CardTitle>
          <CardDescription>Resolution time patterns for tickets completed this week</CardDescription>
        </CardHeader>
        <CardContent>
          {data.resolutionTimeData.every(item => item.avgTime === null) ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mb-4 text-orange-500 opacity-50" />
              <p className="text-lg font-medium">No Completed Tickets</p>
              <p className="text-sm text-center mt-2">
                Resolution time data will appear once tickets are completed
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.resolutionTimeData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                  itemStyle={{
                    color: "hsl(var(--card-foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--card-foreground))",
                    fontWeight: "600",
                  }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.avgTime === null) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-sm mb-2">{label}</p>
                            <p className="text-xs text-muted-foreground">No completed tickets</p>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-2">{label}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <span>Average Resolution</span>
                              <span className="font-medium">{data.avgTime}h</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Completed Tickets</span>
                              <span className="font-medium">{data.ticketCount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="avgTime" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]} 
                  name="Avg Resolution Time (hours)"
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
