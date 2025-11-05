"use client"

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
} from "recharts"

const weeklyData = [
  { day: "Mon", tickets: 12, resolved: 10 },
  { day: "Tue", tickets: 19, resolved: 15 },
  { day: "Wed", tickets: 8, resolved: 8 },
  { day: "Thu", tickets: 15, resolved: 12 },
  { day: "Fri", tickets: 22, resolved: 18 },
  { day: "Sat", tickets: 6, resolved: 5 },
  { day: "Sun", tickets: 4, resolved: 4 },
]

const rootCauseData = [
  { name: "Fiber Cut", value: 35, color: "#3b82f6" }, // Blue
  { name: "Equipment Failure", value: 25, color: "#ef4444" }, // Red
  { name: "Power Outage", value: 20, color: "#f97316" }, // Orange
  { name: "Configuration Error", value: 15, color: "#22c55e" }, // Green
  { name: "Other", value: 5, color: "#8b5cf6" }, // Purple
]

const responseTimeData = [
  { hour: "00:00", avgTime: 2.1 },
  { hour: "04:00", avgTime: 1.8 },
  { hour: "08:00", avgTime: 3.2 },
  { hour: "12:00", avgTime: 2.9 },
  { hour: "16:00", avgTime: 3.5 },
  { hour: "20:00", avgTime: 2.4 },
]

export function TicketAnalytics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Ticket Volume */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Weekly Ticket Volume</CardTitle>
          <CardDescription>Tickets created vs resolved over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend />
              <Bar dataKey="tickets" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Created" />
              <Bar dataKey="resolved" fill="#22c55e" radius={[2, 2, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Root Cause Analysis */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Root Cause Analysis</CardTitle>
          <CardDescription>Distribution of ticket root causes this month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#374151",
                }}
              />
              <Legend />
              <Pie
                data={rootCauseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {rootCauseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {rootCauseData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Time Trends */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle>Average Response Time</CardTitle>
          <CardDescription>Response time trends throughout the day (in hours)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 4]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#374151",
                }}
              />
              <Line
                dataKey="avgTime"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
                name="Avg Response Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
