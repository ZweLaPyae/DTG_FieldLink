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
import mockDb from "../../mock_database.json"

// Helper function to get the week's dates
const getWeekDates = () => {
  const today = new Date()
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date)
  }
  return dates
}

// Helper function to calculate hours between dates
const getHoursBetween = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
}

// Calculate weekly ticket volume
const weeklyData = getWeekDates().map(date => {
  const dayTickets = mockDb.tickets.filter(ticket => {
    const ticketDate = new Date(ticket.issueTime)
    return ticketDate.toDateString() === date.toDateString()
  })
  const resolvedTickets = dayTickets.filter(ticket => ticket.status === 'completed')
  return {
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
    tickets: dayTickets.length,
    resolved: resolvedTickets.length
  }
})

// Calculate root cause distribution
const rootCauseCounts = mockDb.tickets.reduce((acc: { [key: string]: number }, ticket) => {
  if (ticket.rootCause) {
    acc[ticket.rootCause] = (acc[ticket.rootCause] || 0) + 1
  }
  return acc
}, {})

const rootCauseData = mockDb.root_causes.map(cause => ({
  name: cause.name,
  value: Math.round((rootCauseCounts[cause.id] || 0) / mockDb.tickets.length * 100),
  color: cause.color
}))

// Calculate response time by hour
const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
const responseTimeData = hours.map(hour => {
  const [h] = hour.split(':')
  const hourNum = parseInt(h)
  const hourTickets = mockDb.tickets.filter(ticket => {
    if (ticket.issueTime && ticket.startTime) {
      const issueDate = new Date(ticket.issueTime)
      return issueDate.getHours() >= hourNum && issueDate.getHours() < (hourNum + 4)
    }
    return false
  })
  
  const avgResponse = hourTickets.reduce((acc, ticket) => {
    if (ticket.issueTime && ticket.startTime) {
      return acc + getHoursBetween(ticket.issueTime, ticket.startTime)
    }
    return acc
  }, 0) / (hourTickets.length || 1)

  return {
    hour,
    avgTime: Math.round(avgResponse * 10) / 10
  }
})

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
