"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DateRange } from "react-day-picker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  LineChart,
  Line,
  Tooltip,
  Legend,
} from "recharts"
import { Clock, CheckCircle, AlertTriangle, Download, Loader2, Search, Calendar as CalendarIcon } from "lucide-react"

interface AnalyticsData {
  summary: {
    totalTickets: number
    completedTickets: number
    activeTickets: number
    avgResolutionTime: number
    completionRate: number
  }
  trends: {
    ticketChange: number
    completionChange: number
    activeTicketsChange: number
    avgTimeChange: number
    costChange: number
    previousPeriod: {
      totalTickets: number
      completedTickets: number
      activeTickets: number
      avgResolutionTime: number
    }
  }
  performanceData: Array<{
    month: string
    tickets: number
    resolved: number
    unresolved: number
    avgTime: number
  }>
  rootCauseData: Array<{
    name: string
    value: number
    color: string
    count: number
  }>
  technicianPerformance: Array<{
    name: string
    tickets: number
    avgTime: number
    satisfaction: number
  }>
  costAnalysis: Array<{
    month: string
    materials: number
    labor: number
    total: number
  }>
  serviceAreaData: Array<{
    area: string
    tickets: number
  }>
  topCustomers: Array<{
    rank: number
    id: string
    name: string
    ticketCount: number
    completedCount: number
    completionRate: number
  }>
  topMaterials: Array<{
    id: number
    name: string
    totalQuantity: number
    usageCount: number
    unit: string
    referenceLength: number | null
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 29)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: thirtyDaysAgo, to: today })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<{id: string, name: string, x: number, y: number} | null>(null)

  const formatDateLabel = (date: Date) =>
    date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatRangeLabel = (range?: DateRange) => {
    if (!range?.from || !range?.to) return "Select date range"
    return `${formatDateLabel(range.from)} - ${formatDateLabel(range.to)}`
  }

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return
    const { from, to } = dateRange

    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          start: from.toISOString(),
          end: to.toISOString(),
        })

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics?${params.toString()}`,
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        
        const data = await response.json()
        setAnalyticsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [dateRange])

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Error Loading Analytics</CardTitle>
              <CardDescription>{error || 'Failed to load analytics data'}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const { summary, trends, performanceData, rootCauseData, technicianPerformance, costAnalysis, serviceAreaData, topCustomers, topMaterials } = analyticsData

  const safeTopMaterials = topMaterials || []

  // Export analytics data as CSV
  const exportAnalytics = () => {
    if (!analyticsData || !dateRange?.from || !dateRange?.to) return

    const periodLabel = `${formatDateLabel(dateRange.from)} - ${formatDateLabel(dateRange.to)}`

    const rangeDays = Math.max(
      1,
      Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    )
    const previousEnd = new Date(dateRange.from)
    previousEnd.setDate(previousEnd.getDate() - 1)
    const previousStart = new Date(previousEnd)
    previousStart.setDate(previousStart.getDate() - (rangeDays - 1))

    let csvContent = `DTG FieldLink Analytics Report\n`
    csvContent += `Period: ${periodLabel}\n`
    csvContent += `Comparison Period: ${formatDateLabel(previousStart)} - ${formatDateLabel(previousEnd)}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`

    // Summary Section
    csvContent += `SUMMARY\n`
    csvContent += `Total Tickets,${summary.totalTickets}\n`
    csvContent += `Completed Tickets,${summary.completedTickets}\n`
    csvContent += `Active Tickets,${summary.activeTickets}\n`
    csvContent += `Average Resolution Time (hours),${summary.avgResolutionTime}\n`
    csvContent += `Completion Rate (%),${summary.completionRate}%\n\n`

    // Trends Section
    csvContent += `PERIOD-OVER-PERIOD TRENDS\n`
    csvContent += `Metric,Current Period,Previous Period,Change (%)\n`
    csvContent += `Total Tickets,${summary.totalTickets},${trends.previousPeriod.totalTickets},${trends.ticketChange > 0 ? '+' : ''}${trends.ticketChange}%\n`
    csvContent += `Completed Tickets,${summary.completedTickets},${trends.previousPeriod.completedTickets},${trends.completionChange > 0 ? '+' : ''}${trends.completionChange}%\n`
    csvContent += `Active Tickets,${summary.activeTickets},${trends.previousPeriod.activeTickets},${trends.activeTicketsChange > 0 ? '+' : ''}${trends.activeTicketsChange}%\n`
    csvContent += `Avg Resolution Time,${summary.avgResolutionTime.toFixed(1)},${trends.previousPeriod.avgResolutionTime.toFixed(1)},${trends.avgTimeChange > 0 ? '+' : ''}${trends.avgTimeChange}%\n\n`

    // Performance Data
    csvContent += `TICKET VOLUME & RESOLUTION\n`
    csvContent += `Period,Total Tickets,Resolved Tickets,Average Time (hours)\n`
    performanceData.forEach(item => {
      csvContent += `${item.month},${item.tickets},${item.resolved},${item.avgTime.toFixed(1)}\n`
    })
    csvContent += `\n`

    // Root Cause Data
    csvContent += `ROOT CAUSE DISTRIBUTION\n`
    csvContent += `Root Cause,Count,Percentage (%)\n`
    rootCauseData.forEach(item => {
      csvContent += `${item.name},${item.count},${item.value}\n`
    })
    csvContent += `\n`

    // Technician Performance
    csvContent += `TECHNICIAN/TEAM PERFORMANCE\n`
    csvContent += `Name,Total Tickets,Average Time (hours),Completion Rate (%)\n`
    technicianPerformance.forEach(tech => {
      csvContent += `${tech.name},${tech.tickets},${tech.avgTime},${tech.satisfaction}%\n`
    })
    csvContent += `\n`

    // Cost Analysis
    const totalMaterialCost = costAnalysis.reduce((sum, item) => sum + item.materials, 0)
    
    csvContent += `COST ANALYSIS\n`
    csvContent += `Period,Materials Cost (MMK)\n`
    costAnalysis.forEach(item => {
      csvContent += `${item.month},${item.materials}\n`
    })
    csvContent += `Total,${totalMaterialCost}\n\n`

    // Service Area Data
    csvContent += `SERVICE AREA DISTRIBUTION\n`
    csvContent += `Area,Ticket Count\n`
    serviceAreaData.forEach(item => {
      csvContent += `${item.area},${item.tickets}\n`
    })
    csvContent += `\n`

    // Top Customers
    csvContent += `TOP CUSTOMERS\n`
    csvContent += `Rank,Customer Name,Total Tickets,Completed,Completion Rate\n`
    topCustomers.forEach(customer => {
      csvContent += `${customer.rank},${customer.name},${customer.ticketCount},${customer.completedCount},${customer.completionRate}%\n`
    })
    csvContent += `\n`

    // Top Materials
    csvContent += `MOST USED MATERIALS\n`
    csvContent += `Rank,Material Name,Total Quantity,Unit Type,Usage Count\n`
    safeTopMaterials.forEach((material, index) => {
      const unit = material.unit === 'METER' ? 'meters' : 'units';
      csvContent += `${index + 1},${material.name},${material.totalQuantity},${unit},${material.usageCount}\n`
    })

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    const fileName = dateRange?.from && dateRange?.to
      ? `analytics_report_${dateRange.from.toISOString().split('T')[0]}_${dateRange.to.toISOString().split('T')[0]}.csv`
      : `analytics_report_${new Date().toISOString().split('T')[0]}.csv`

    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Custom tooltip for performance chart
  const PerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0]?.value || 0
      const resolved = payload[1]?.value || 0
      const unresolved = total - resolved
      const hasBacklog = unresolved > 0

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                New Tickets
              </span>
              <span className="font-medium">{total}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                Resolved
              </span>
              <span className="font-medium">{resolved}</span>
            </div>
            {hasBacklog && (
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-border mt-1">
                <span className="flex items-center text-orange-500">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unresolved
                </span>
                <span className="font-semibold text-orange-500">{unresolved}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[200px]">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Comprehensive insights and performance metrics
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[280px] justify-start"
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{formatRangeLabel(dateRange)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-auto" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  defaultMonth={dateRange?.from || new Date()}
                  onSelect={(range) => setDateRange(range)}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={exportAnalytics} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTickets}</div>
              <p className="text-xs text-muted-foreground">Total tickets in period</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avgResolutionTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Average time to resolution</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeTickets}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Total Cost</CardTitle>
              <CardDescription>Total materials cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(costAnalysis.reduce((sum, item) => sum + item.materials, 0) / 1000).toFixed(1)}K MMK
              </div>
              <p className="text-xs text-muted-foreground">Materials costs from all tickets in period</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    formatter={(value: any, name: any, props: any) => {
                      return [`${props.payload.count} tickets`, props.payload.name];
                    }}
                  />
                  <Pie
                    data={(() => {
                      // Sort by count descending and take top 5
                      const sorted = [...rootCauseData].sort((a, b) => b.count - a.count);
                      const top5 = sorted.slice(0, 5);
                      const others = sorted.slice(5);
                      
                      if (others.length > 0) {
                        const othersSum = others.reduce((sum, item) => sum + item.value, 0);
                        const othersCount = others.reduce((sum, item) => sum + item.count, 0);
                        return [
                          ...top5,
                          {
                            name: 'Others',
                            value: othersSum,
                            count: othersCount,
                            color: '#9CA3AF'
                          }
                        ];
                      }
                      return top5;
                    })()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(() => {
                      const sorted = [...rootCauseData].sort((a, b) => b.count - a.count);
                      const top5 = sorted.slice(0, 5);
                      const others = sorted.slice(5);
                      const displayData = others.length > 0 
                        ? [...top5, { name: 'Others', value: 0, count: 0, color: '#9CA3AF' }]
                        : top5;
                      
                      return displayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ));
                    })()}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {(() => {
                  const sorted = [...rootCauseData].sort((a, b) => b.count - a.count);
                  const top5 = sorted.slice(0, 5);
                  const others = sorted.slice(5);
                  
                  const displayLegend = [...top5];
                  if (others.length > 0) {
                    const othersCount = others.reduce((sum, item) => sum + item.count, 0);
                    displayLegend.push({
                      name: 'Others',
                      value: 0,
                      count: othersCount,
                      color: '#9CA3AF'
                    });
                  }
                  
                  return displayLegend.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count} tickets</span>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Most Used Materials</CardTitle>
              <CardDescription>Top 5 frequently used materials</CardDescription>
            </CardHeader>
            <CardContent>
              {safeTopMaterials.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p className="text-sm">No material usage data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeTopMaterials.map((material, index) => {
                    const quantityDisplay = material.unit === 'METER' 
                      ? `${material.totalQuantity.toFixed(1)} m`
                      : `${material.totalQuantity} units`;
                    
                    return (
                      <div key={material.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{material.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Used in {material.usageCount} ticket{material.usageCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{quantityDisplay}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technician Performance & SLA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Team metrics and ratings</CardDescription>
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
                        <span className="text-2xl font-bold">{tech.satisfaction}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">completion rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Service Area Distribution</CardTitle>
              <CardDescription>Top service areas by ticket volume</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceAreaData.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p className="text-sm">No service area data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceAreaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="area" 
                      stroke="#6b7280" 
                      fontSize={12}
                      width={100}
                    />
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
                    <Bar 
                      dataKey="tickets" 
                      fill="#3b82f6" 
                      radius={[0, 8, 8, 0]}
                      name="Tickets"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <Card className="border-border/50 relative">
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Customers with the most tickets in this period</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">No customer data available</p>
              </div>
            ) : (
              <div className="relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead className="text-right">Total Tickets</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <TableRow 
                        key={customer.id}
                        className="cursor-pointer hover:bg-muted/70"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setSelectedCustomer({
                            id: customer.id,
                            name: customer.name,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          })
                        }}
                      >
                        <TableCell className="font-medium">
                          {customer.rank <= 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {customer.rank}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{customer.rank}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-right">{customer.ticketCount}</TableCell>
                        <TableCell className="text-right">{customer.completedCount}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            customer.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                            customer.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {customer.completionRate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Search Icon Popup */}
                {selectedCustomer && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setSelectedCustomer(null)}
                    />
                    {/* Search Icon */}
                    <button
                      className="absolute z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
                      style={{
                        left: `${selectedCustomer.x}px`,
                        top: `${selectedCustomer.y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/tickets?customerName=${encodeURIComponent(selectedCustomer.name)}`)
                      }}
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
