"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, TrendingUp, Plus, Filter } from "lucide-react"
import Link from "next/link"

const tickets = [
  {
    id: "TK-2024-001",
    customerId: "CUST-12345",
    customerName: "John Smith",
    phone: "+1 (555) 123-4567",
    serviceType: "Fiber 100Mbps",
    location: "123 Main St, Downtown",
    sla: "4 hours",
    complaint: "No internet connection",
    status: "In Progress",
    priority: "High",
    technician: "Mike Johnson",
    issueTime: "2024-01-15 09:30",
    estimatedCompletion: "2024-01-15 13:30",
  },
  {
    id: "TK-2024-002",
    customerId: "CUST-67890",
    customerName: "Sarah Wilson",
    phone: "+1 (555) 987-6543",
    serviceType: "Fiber 500Mbps",
    location: "456 Oak Ave, Uptown",
    sla: "2 hours",
    complaint: "Slow internet speed",
    status: "Pending",
    priority: "Medium",
    technician: "Unassigned",
    issueTime: "2024-01-15 11:15",
    estimatedCompletion: "TBD",
  },
  {
    id: "TK-2024-003",
    customerId: "CUST-11111",
    customerName: "Robert Davis",
    phone: "+1 (555) 456-7890",
    serviceType: "Fiber 1Gbps",
    location: "789 Pine St, Midtown",
    sla: "1 hour",
    complaint: "Complete service outage",
    status: "Completed",
    priority: "Critical",
    technician: "Alex Chen",
    issueTime: "2024-01-15 08:00",
    estimatedCompletion: "2024-01-15 09:00",
  },
]

const statusColors = {
  Pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
  "In Progress": "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  Completed: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  "On Hold": "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400",
}

const priorityColors = {
  Low: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  Critical: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
}

export function TicketOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">24</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <span className="text-green-500">+12%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">8</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              <span className="text-blue-500">Active</span> assignments
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">12</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              <span className="text-green-500">+8</span> since yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg Resolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">2.4h</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              <span className="text-green-500">-15min</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest maintenance requests and their current status</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                <Link href="/dashboard/tickets/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium text-foreground">{ticket.id}</div>
                    <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                      {ticket.status}
                    </Badge>
                    <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <div className="font-medium">{ticket.customerName}</div>
                      <div className="text-muted-foreground">{ticket.phone}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issue:</span>
                      <div className="font-medium">{ticket.complaint}</div>
                      <div className="text-muted-foreground">{ticket.location}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Technician:</span>
                      <div className="font-medium">{ticket.technician}</div>
                      <div className="text-muted-foreground">SLA: {ticket.sla}</div>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
