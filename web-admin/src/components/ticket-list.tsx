"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, MapPin, User, AlertCircle } from "lucide-react"

interface TicketListProps {
  searchQuery: string
  statusFilter: string
  selectedTicket: string | null
  onSelectTicket: (ticketId: string) => void
  refreshKey?: number
}

interface Ticket {
  id: string
  complaint: string
  status: string
  sla: string
  issueTime: string
  customerName: string | null
  phone: string[] | null
  splitter: string | null
  technician_display: string | null
}

const statusColors = {
  NEW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_REVIEW: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
}

export function TicketList({
  searchQuery,
  statusFilter,
  selectedTicket,
  onSelectTicket,
  refreshKey,
}: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets`)
        if (response.ok) {
          const data = await response.json()
          setTickets(data)
        }
      } catch (error) {
        console.error("Error fetching tickets:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTickets()
  }, [refreshKey])

  const filteredTickets = tickets.filter((ticket) => {
    const customerName = ticket.customerName || ""
    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.complaint.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    )
  }

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
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-foreground">{ticket.id}</span>
                  <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(ticket.issueTime).toLocaleString()}
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{ticket.customerName || "Unknown"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{ticket.splitter || "-"}</span>
                </div>
              </div>

              {/* Issue */}
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{ticket.complaint}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {ticket.technician_display || "Unassigned"} • SLA: {ticket.sla}
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
