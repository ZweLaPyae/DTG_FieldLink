"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, MapPin, User, AlertCircle } from "lucide-react"

interface TicketListProps {
  searchQuery: string
  statusFilter: string
  priorityFilter: string
  selectedTicket: string | null
  onSelectTicket: (ticketId: string) => void
}

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
    status: "in-progress",
    priority: "high",
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
    status: "pending",
    priority: "medium",
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
    status: "completed",
    priority: "critical",
    technician: "Alex Chen",
    issueTime: "2024-01-15 08:00",
    estimatedCompletion: "2024-01-15 09:00",
  },
  {
    id: "TK-2024-004",
    customerId: "CUST-22222",
    customerName: "Emily Johnson",
    phone: "+1 (555) 234-5678",
    serviceType: "Fiber 200Mbps",
    location: "321 Elm St, Westside",
    sla: "6 hours",
    complaint: "Intermittent connection drops",
    status: "on-hold",
    priority: "low",
    technician: "David Lee",
    issueTime: "2024-01-15 14:20",
    estimatedCompletion: "2024-01-15 20:20",
  },
]

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  "on-hold": "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function TicketList({
  searchQuery,
  statusFilter,
  priorityFilter,
  selectedTicket,
  onSelectTicket,
}: TicketListProps) {
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.complaint.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-4">
      {filteredTickets.map((ticket) => (
        <Card
          key={ticket.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border-border/50",
            selectedTicket === ticket.id && "ring-2 ring-primary border-primary/50",
          )}
          onClick={() => onSelectTicket(ticket.id)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-foreground">{ticket.id}</span>
                  <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                    {ticket.status.replace("-", " ")}
                  </Badge>
                  <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                    {ticket.priority}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  {ticket.issueTime}
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{ticket.customerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{ticket.location}</span>
                </div>
              </div>

              {/* Issue */}
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{ticket.complaint}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {ticket.technician} • SLA: {ticket.sla}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredTickets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tickets found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
