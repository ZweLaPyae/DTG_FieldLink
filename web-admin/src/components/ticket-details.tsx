"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { User, Phone, MapPin, Clock, AlertCircle, Wrench, FileText, Camera, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketDetailsProps {
  ticketId: string
  isSelected?: boolean
}

interface Ticket {
  id: string
  complaint: string
  status: string
  sla: string
  issueTime: string
  completionTime: string | null
  priorityId: string
  customerId: string
  rootCauseId: string | null
  rootCauseDetails: string | null
  wayToFix: string | null
  materialsUsed: any
  totalCost: number | null
  attachments: any
  updates: any
  customer?: {
    id: string
    name: string
    phone: string[]
    splitter: string | null
    serviceType?: {
      name: string
    }
  }
  technician?: {
    name: string
  }
  priority?: {
    display: string
  }
  rootCause?: {
    name: string
  }
  breakTimes?: Array<{
    reason: string
    startTime: string
    endTime: string
  }>
}

export function TicketDetails({ ticketId, isSelected = false }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newUpdate, setNewUpdate] = useState("")
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`)
        if (response.ok) {
          const data = await response.json()
          setTicket(data)
        }
      } catch (error) {
        console.error("Error fetching ticket:", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading ticket details...</p>
        </CardContent>
      </Card>
    )
  }

  if (!ticket) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Ticket not found</p>
        </CardContent>
      </Card>
    )
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    "on-hold": "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }

  const priorityColors = {
    low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    critical: "bg-red-600/10 text-red-600 border-red-600/20",
  }
  const priorityKey =
  (ticket.priorityId?.toLowerCase() as keyof typeof priorityColors) ?? "low"

  return (
    <div className="space-y-4">
      <Card className={cn(
        "border-border/50",
        isSelected && (priorityKey !== "critical" || ticket.status === "completed") && "ring-2 ring-primary border-primary/50",
        priorityKey === "critical" && ticket.status !== "completed" && "border-2 border-red-600 shadow-red-500/20 shadow-lg",
        isSelected && priorityKey === "critical" && ticket.status !== "completed" && "ring-2 ring-red-600"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{ticket.id}</CardTitle>
            <div className="flex space-x-2">
              <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                {ticket.status.replace("-", " ")}
              </Badge>
              <Badge variant="outline" className={priorityColors[(ticket.priority?.display || "Normal") as keyof typeof priorityColors]}>
                {ticket.priority?.display || "Normal"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 grid grid-cols-4 gap-4">
          {/* Customer Information */}
          <div className="space-y-3 col-span-2 shadow-sm p-2 rounded-md border border-border/50">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Customer Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{ticket.customer?.name || ticket.customerId}</span>
                <span className="text-sm text-muted-foreground">({ticket.customerId})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{ticket.customer?.phone?.join(", ") || "-"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{ticket.customer?.splitter || "-"}</span>
              </div>
            </div>
          </div>


          {/* Issue Details */}
          <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Issue Details</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{ticket.complaint}</p>
                  <p className="text-sm text-muted-foreground">Service: {ticket.customer?.serviceType?.name || "-"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">SLA: {ticket.sla}</span>
              </div>
            </div>
          </div>


          {/* Resolution Details */}
          {ticket.rootCause && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Resolution Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Wrench className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Root Cause: {ticket.rootCause?.name || "-"}</p>
                      <p className="text-sm text-muted-foreground">{ticket.rootCauseDetails || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Solution</p>
                      <p className="text-sm text-muted-foreground">{ticket.wayToFix || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Materials & Cost */}
          {ticket.materialsUsed && Array.isArray(ticket.materialsUsed) && ticket.materialsUsed.length > 0 && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Materials & Cost
                </h4>
                <div className="space-y-2">
                  {ticket.materialsUsed.map((material: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{material.item}</span>
                      <span className="font-medium">${material.cost}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Cost</span>
                    <span className="text-primary">${ticket.totalCost || "0"}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Attachments */}
          {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Attachments</h4>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-primary cursor-pointer hover:underline">{attachment.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}

          {/* Break Times */}
          {ticket.breakTimes && Array.isArray(ticket.breakTimes) && ticket.breakTimes.length > 0 && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Break Times</h4>
                <div className="space-y-2">
                  {ticket.breakTimes.map((breakTime: any, idx: number) => {
                    const start = new Date(breakTime.startTime).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                    const end = new Date(breakTime.endTime).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                    return (
                      <div key={idx} className="flex flex-col border rounded p-2 bg-muted/10">
                        <span className="font-medium">Reason: {breakTime.reason}</span>
                        <span className="text-sm text-muted-foreground">Start: {start}</span>
                        <span className="text-sm text-muted-foreground">End: {end}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Status Update */}
          <div className="space-y-3 col-span-4 shadow-sm p-4 rounded-md border border-border/50">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Update Status</h4>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusColors).map(([status]) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Add update notes..."
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              rows={3}
            />
            <Button className="w-full">
              <Edit3 className="w-4 h-4 mr-2" />
              Update Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="border-border/50 col-span-4 shadow-sm p-4 rounded-md border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.updates && Array.isArray(ticket.updates) && ticket.updates.length > 0 ? (
              ticket.updates.map((update: any, index: number) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{update.user}</span>
                      <span className="text-xs text-muted-foreground">{update.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{update.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activity updates</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
