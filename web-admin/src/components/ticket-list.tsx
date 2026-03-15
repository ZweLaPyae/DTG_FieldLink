"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, MapPin, User, AlertCircle, Trash2 } from "lucide-react"
import { useAdminId } from "@/hooks/useAdminId"

interface TicketListProps {
  searchQuery: string
  statusFilter: string
  startDate: string
  endDate: string
  selectedTicket: string | null
  onSelectTicket: (ticketId: string) => void
  refreshKey?: number
  onTicketDelete?: () => void
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
  priority: string | null
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
  startDate,
  endDate,
  selectedTicket,
  onSelectTicket,
  refreshKey,
  onTicketDelete,
}: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { adminId, isLoading: isAdminLoading } = useAdminId()
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true)
        setUsingFallback(false)

        // Build URL with query parameters
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const queryString = params.toString()
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets${queryString ? `?${queryString}` : ''}`

        const response = await fetch(url)
        if (response.ok) {
          let data = await response.json()

          // Check if we need fallback for IN_REVIEW status
          if (statusFilter === 'IN_REVIEW') {
            const inReviewTickets = data.filter((t: Ticket) => t.status === 'IN_REVIEW')
            if (inReviewTickets.length === 0 && startDate && endDate) {
              // Fallback: fetch all tickets without date filter
              const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets`)
              if (fallbackResponse.ok) {
                const allData = await fallbackResponse.json()
                // Get last 10 IN_REVIEW tickets
                const allInReview = allData.filter((t: Ticket) => t.status === 'IN_REVIEW')
                data = allInReview.slice(0, 10)
                setUsingFallback(true)
              }
            }
          }

          setTickets(data)
        }
      } catch (error) {
        console.error("Error fetching tickets:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTickets()
  }, [refreshKey, startDate, endDate, statusFilter])

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

  const handleDeleteTicket = async (ticketId: string) => {
    if (isAdminLoading) return
    if (!adminId) {
      alert("Admin ID not available. Please sign in again.")
      return
    }

    if (!confirm(`Delete ticket ${ticketId}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: adminId }),
      })

      if (response.ok || response.status === 204) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId))
        if (onTicketDelete) onTicketDelete()
      } else {
        const error = await response.json()
        alert(`Failed to delete ticket: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error deleting ticket:", error)
      alert("Network error: Failed to delete ticket")
    }
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                  <span className="font-semibold text-foreground">{ticket.id}</span>
                  <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ticket ${ticket.id}`}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      handleDeleteTicket(ticket.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {ticket.priority?.toLowerCase() === 'urgent' && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      URGENT
                    </Badge>
                  )}
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
                    Assigned to: {ticket.technician_display || "Unassigned"}
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
