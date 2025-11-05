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

const performanceData = [
  { month: "Jan", tickets: 145, resolved: 142, avgTime: 2.3 },
  { month: "Feb", tickets: 132, resolved: 128, avgTime: 2.1 },
  { month: "Mar", tickets: 168, resolved: 165, avgTime: 2.4 },
  { month: "Apr", tickets: 156, resolved: 151, avgTime: 2.2 },
  { month: "May", tickets: 189, resolved: 186, avgTime: 2.0 },
  { month: "Jun", tickets: 201, resolved: 198, avgTime: 1.9 },
]

const rootCauseData = [
  { name: "Fiber Cut", value: 35, color: "#3b82f6", count: 42 }, // Blue
  { name: "Equipment Failure", value: 25, color: "#ef4444", count: 30 }, // Red
  { name: "Power Outage", value: 20, color: "#f97316", count: 24 }, // Orange
  { name: "Configuration Error", value: 15, color: "#22c55e", count: 18 }, // Green
  { name: "Other", value: 5, color: "#8b5cf6", count: 6 }, // Purple
]

const technicianPerformance = [
  { name: "Mike Johnson", tickets: 45, avgTime: 1.8, satisfaction: 4.8 },
  { name: "Alex Chen", tickets: 38, avgTime: 2.1, satisfaction: 4.6 },
  { name: "David Lee", tickets: 42, avgTime: 2.3, satisfaction: 4.7 },
  { name: "Sarah Wilson", tickets: 35, avgTime: 1.9, satisfaction: 4.9 },
]

const costAnalysis = [
  { month: "Jan", materials: 12500, labor: 18000, total: 30500 },
  { month: "Feb", materials: 11200, labor: 16800, total: 28000 },
  { month: "Mar", materials: 14800, labor: 21600, total: 36400 },
  { month: "Apr", materials: 13200, labor: 19200, total: 32400 },
  { month: "May", materials: 15600, labor: 22800, total: 38400 },
  { month: "Jun", materials: 16800, labor: 24000, total: 40800 },
]

const slaPerformance = [
  { sla: "1 hour", met: 85, missed: 15 },
  { sla: "2 hours", met: 92, missed: 8 },
  { sla: "4 hours", met: 96, missed: 4 },
  { sla: "6 hours", met: 98, missed: 2 },
  { sla: "24 hours", met: 99, missed: 1 },
]

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
              <div className="text-2xl font-bold">1,091</div>
              <p className="text-xs">
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5%
                </span>
                from last period
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.1h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -8.7%
                </span>
                improvement
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.1%
                </span>
                from last period
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Total Cost</CardTitle>
              <CardDescription>Cost breakdown by materials and labor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$206K</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.3%
                </span>
                from last period
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
