"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Tooltip,
  Legend,
} from "recharts"
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Download } from "lucide-react"

import mockDb from "../../../../mock_database.json"

// Helper function to calculate date differences in hours
const getHoursBetween = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
}

// Get completed tickets
const completedTickets = mockDb.tickets.filter(ticket => ticket.status === 'completed')

// Calculate average resolution time
const avgResolutionTime = completedTickets.reduce((acc, ticket) => {
  if (ticket.issueTime && ticket.completionTime) {
    return acc + getHoursBetween(ticket.issueTime, ticket.completionTime)
  }
  return acc
}, 0) / completedTickets.length

// Group tickets by day for performance data
const today = new Date()
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const performanceData = days.map(day => {
  const dayTickets = mockDb.tickets.filter(ticket => {
    const ticketDate = new Date(ticket.issueTime)
    return days[ticketDate.getDay()] === day
  })
  const resolvedTickets = dayTickets.filter(ticket => ticket.status === 'completed')
  return {
    month: day,
    tickets: dayTickets.length,
    resolved: resolvedTickets.length,
    avgTime: avgResolutionTime
  }
})

// Calculate root cause distribution
const rootCauseCounts = mockDb.tickets.reduce((acc: { [key: string]: number }, ticket) => {
  if (ticket.rootCause) {
    acc[ticket.rootCause] = (acc[ticket.rootCause] || 0) + 1
  }
  return acc
}, {})

const rootCauseData = mockDb.root_causes.map(cause => {
  const count = rootCauseCounts[cause.id] || 0
  const total = mockDb.tickets.length
  return {
    name: cause.name,
    value: Math.round((count / total) * 100),
    color: cause.color,
    count: count
  }
})

// Calculate technician performance
const technicianPerformance = mockDb.technicians.map(tech => {
  const techTickets = mockDb.tickets.filter(ticket => ticket.technicianId === tech.id)
  const completedTechTickets = techTickets.filter(ticket => ticket.status === 'completed')
  const avgTime = completedTechTickets.reduce((acc, ticket) => {
    if (ticket.issueTime && ticket.completionTime) {
      return acc + getHoursBetween(ticket.issueTime, ticket.completionTime)
    }
    return acc
  }, 0) / (completedTechTickets.length || 1)
  
  return {
    name: tech.name,
    tickets: techTickets.length,
    avgTime: Math.round(avgTime * 10) / 10,
    satisfaction: 4.5 + (techTickets.length > 0 ? 0.5 * (completedTechTickets.length / techTickets.length) : 0)
  }
})

// Calculate cost analysis
const costAnalysis = days.map(day => {
  const dayTickets = mockDb.tickets.filter(ticket => {
    const ticketDate = new Date(ticket.issueTime)
    return days[ticketDate.getDay()] === day
  })
  
  const materialCosts = dayTickets.reduce((acc, ticket) => {
    return acc + (ticket.materialsUsed?.reduce((sum, material) => sum + material.cost, 0) || 0)
  }, 0)
  
  const laborCosts = dayTickets.reduce((acc, ticket) => {
    if (ticket.issueTime && ticket.completionTime) {
      const hours = getHoursBetween(ticket.issueTime, ticket.completionTime)
      return acc + (hours * 100) // Assuming $100 per hour labor cost
    }
    return acc
  }, 0)

  return {
    month: day,
    materials: materialCosts,
    labor: laborCosts,
    total: materialCosts + laborCosts
  }
})

// Calculate SLA performance
const slaPerformance = mockDb.sla_options.map(sla => {
  const slaTickets = mockDb.tickets.filter(ticket => ticket.sla === sla && ticket.status === 'completed')
  const metSLA = slaTickets.filter(ticket => {
    if (ticket.issueTime && ticket.completionTime) {
      const hours = getHoursBetween(ticket.issueTime, ticket.completionTime)
      const targetHours = parseInt(sla)
      return hours <= targetHours
    }
    return false
  })
  
  const metPercentage = slaTickets.length > 0 ? Math.round((metSLA.length / slaTickets.length) * 100) : 100
  
  return {
    sla,
    met: metPercentage,
    missed: 100 - metPercentage
  }
})

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex space-x-2">
            <Select defaultValue="6months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDb.tickets.length}</div>
              <p className="text-xs">
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{((completedTickets.length / mockDb.tickets.length) * 100).toFixed(1)}%
                </span>
                completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResolutionTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {((completedTickets.length / mockDb.tickets.length) * 100).toFixed(1)}%
                </span>
                resolution rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((mockDb.tickets.filter(t => 
                    t.status === 'completed' && 
                    t.completionTime && 
                    new Date(t.completionTime).toDateString() === new Date().toDateString()
                  ).length / mockDb.tickets.length) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {completedTickets.length}
                </span>
                total completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Total Cost</CardTitle>
              <CardDescription>Cost breakdown by materials and labor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(mockDb.tickets.reduce((sum, ticket) => 
                  sum + (ticket.materialsUsed?.reduce((acc, material) => acc + material.cost, 0) || 0) +
                  (ticket.completionTime && ticket.issueTime ? 
                    getHoursBetween(ticket.issueTime, ticket.completionTime) * 100 : 0), // Labor cost
                  0) / 1000).toFixed(1)}K
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {completedTickets.length} tickets
                </span>
                completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Ticket Volume & Resolution</CardTitle>
              <CardDescription>Monthly ticket creation and resolution trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
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
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Total Tickets"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                    name="Resolved Tickets"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Root Cause Distribution</CardTitle>
              <CardDescription>Breakdown of ticket root causes</CardDescription>
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
                  />
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
              <div className="mt-4 grid grid-cols-1 gap-2">
                {rootCauseData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count} tickets</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Analysis */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>Monthly breakdown of materials and labor costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={costAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
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
                <Bar dataKey="materials" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} name="Materials" />
                <Bar dataKey="labor" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Labor" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Technician Performance & SLA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Individual technician metrics and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianPerformance.map((tech, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div>
                      <p className="font-medium">{tech.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tech.tickets} tickets • {tech.avgTime}h avg
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{tech.satisfaction}</span>
                        <span className="text-xs text-muted-foreground">★</span>
                      </div>
                      <p className="text-xs text-muted-foreground">satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>SLA Performance</CardTitle>
              <CardDescription>Service level agreement compliance by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slaPerformance.map((sla, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{sla.sla}</span>
                      <span className="text-sm text-muted-foreground">{sla.met}% met</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          sla.met >= 95
                            ? "bg-gradient-to-r from-green-500 to-green-400"
                            : sla.met >= 90
                              ? "bg-gradient-to-r from-blue-500 to-blue-400"
                              : sla.met >= 80
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                : "bg-gradient-to-r from-red-500 to-red-400"
                        }`}
                        style={{ width: `${sla.met}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
