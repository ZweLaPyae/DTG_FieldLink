"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, MapPin, User, AlertCircle } from "lucide-react"
import mockDb from "../../mock_database.json"

interface TicketListProps {
  searchQuery: string
  statusFilter: string
  priorityFilter: string
  selectedTicket: string | null
  onSelectTicket: (ticketId: string) => void
}

const tickets = mockDb.tickets

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
      ticket.customerName_display.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                  <span className="font-medium">{ticket.customerName_display}</span>
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
                    Assigned to: {ticket.technician_display} • SLA: {ticket.sla}
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
