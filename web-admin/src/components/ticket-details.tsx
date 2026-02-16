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
  onTicketUpdate?: () => void
}

interface Ticket {
  id: string
  complaint: string
  status: string
  sla: string
  issueTime: string
  startTime: string | null
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
  faultCoordinate?: any
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
    reason?: string
    start: string
    end: string
  }>
}

export function TicketDetails({ ticketId, isSelected = false, onTicketUpdate }: TicketDetailsProps) {
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
          console.log("Ticket data received:", data)
          console.log("Materials used:", data.materialsUsed)
          console.log("Total cost:", data.totalCost)
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

  const handleUpdateTicket = async () => {
    try {
      const updateData: any = {}
      
      // Only include status if it was changed
      if (newStatus && newStatus !== ticket?.status) {
        updateData.status = newStatus
      }

      // If there's nothing to update, return early
      if (Object.keys(updateData).length === 0) {
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // Re-fetch the ticket to get enriched data (materials with names, etc.)
        const getResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`)
        if (getResponse.ok) {
          const enrichedTicket = await getResponse.json()
          setTicket(enrichedTicket)
        }
        setNewStatus("")
        setNewUpdate("")
        // Notify parent to refresh the ticket list
        if (onTicketUpdate) {
          onTicketUpdate()
        }
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
    }
  }

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
    NEW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    IN_REVIEW: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  }

  return (
    <div className="space-y-4">
      <Card className={cn(
        "border-border/50",
        isSelected && "ring-2 ring-primary border-primary/50"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{ticket.id}</CardTitle>
            <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
              {ticket.status.replace("_", " ")}
            </Badge>
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
              <div className="flex flex-col space-y-1 text-sm">
                <span className="text-muted-foreground">Issue Time: <span className="text-foreground">{new Date(ticket.issueTime).toLocaleString()}</span></span>
                {ticket.startTime && (
                  <span className="text-muted-foreground">Start Time: <span className="text-foreground">{new Date(ticket.startTime).toLocaleString()}</span></span>
                )}
                {ticket.completionTime && (
                  <span className="text-muted-foreground">Completion Time: <span className="text-foreground">{new Date(ticket.completionTime).toLocaleString()}</span></span>
                )}
              </div>
              {ticket.technician && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Assigned to: <span className="text-foreground font-medium">{ticket.technician.name}</span></span>
                </div>
              )}
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
          {(ticket.materialsUsed || ticket.totalCost) && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Materials & Cost
                </h4>
                <div className="space-y-2">
                  {ticket.materialsUsed && Array.isArray(ticket.materialsUsed) && ticket.materialsUsed.length > 0 && (
                    <div className="space-y-1">
                      {ticket.materialsUsed.map((material: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>
                            {material.name || `Material ID: ${material.materialId}`}
                            {material.quantity && ` × ${material.quantity}`}
                          </span>
                          {material.unitCost && material.quantity && (
                            <span className="font-medium">MMK{(material.unitCost * material.quantity).toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {ticket.totalCost && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Cost</span>
                        <span className="text-primary">MMK{ticket.totalCost.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Attachments */}
          {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Attachments</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment: any, index: number) => {
                    const url = typeof attachment === 'string' ? attachment : attachment.name;
                    const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
                    
                    if (isImage) {
                      return (
                        <a 
                          key={index} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative group overflow-hidden rounded-lg border border-border/50 hover:border-primary transition-colors"
                        >
                          <img 
                            src={url} 
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </a>
                      );
                    }
                    
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm p-3 rounded-lg border border-border/50 hover:border-primary transition-colors"
                      >
                        <Camera className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-primary hover:underline truncate">
                          {url.split('/').pop()}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>

            </>
          )}

          {/* Fault Coordinates */}
          {ticket.faultCoordinate && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Fault Location</h4>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {Array.isArray(ticket.faultCoordinate) 
                      ? `[${ticket.faultCoordinate.join(', ')}]` 
                      : JSON.stringify(ticket.faultCoordinate)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Break Times */}
          {ticket.breakTimes && Array.isArray(ticket.breakTimes) && ticket.breakTimes.length > 0 && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Break Times</h4>
                <div className="space-y-3">
                  {ticket.breakTimes.map((breakTime: any, idx: number) => {
                    const startDate = new Date(breakTime.start)
                    const endDate = new Date(breakTime.end)
                    const durationMs = endDate.getTime() - startDate.getTime()
                    const durationMinutes = Math.round(durationMs / (1000 * 60))
                    const durationHours = Math.floor(durationMinutes / 60)
                    const remainingMinutes = durationMinutes % 60
                    
                    // Calculate gap from previous break
                    let gapText = null
                    if (idx > 0 && ticket.breakTimes) {
                      const prevBreak = ticket.breakTimes[idx - 1]
                      const prevEnd = new Date(prevBreak.end)
                      const gapMs = startDate.getTime() - prevEnd.getTime()
                      const gapMinutes = Math.round(gapMs / (1000 * 60))
                      const gapHours = Math.floor(gapMinutes / 60)
                      const gapRemainingMinutes = gapMinutes % 60
                      
                      if (gapHours > 0) {
                        gapText = `${gapHours}h ${gapRemainingMinutes}m gap`
                      } else {
                        gapText = `${gapMinutes}m gap`
                      }
                    }
                    
                    const durationDisplay = durationHours > 0 
                      ? `${durationHours}h ${remainingMinutes}m` 
                      : `${durationMinutes}m`
                    
                    // Color code based on duration
                    const durationColor = durationMinutes > 60 
                      ? 'bg-red-100 text-red-700 border-red-300' 
                      : durationMinutes > 30 
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                    
                    const start = startDate.toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                    const end = endDate.toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                    
                    return (
                      <div key={idx}>
                        {/* Gap indicator */}
                        {gapText && (
                          <div className="flex items-center justify-center py-1 mb-2">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <div className="h-px w-8 bg-border"></div>
                              <Clock className="w-3 h-3" />
                              <span>{gapText} between breaks</span>
                              <div className="h-px w-8 bg-border"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Break time card */}
                        <div className="flex flex-col border rounded-lg p-3 bg-muted/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Reason: {breakTime.reason || 'Not specified'}</span>
                            <Badge className={cn("text-xs font-semibold", durationColor)}>
                              {durationDisplay}
                            </Badge>
                          </div>
                          <div className="flex flex-col text-xs text-muted-foreground space-y-1">
                            <span>Start: {start}</span>
                            <span>End: {end}</span>
                          </div>
                          {/* Visual duration bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className={cn(
                                "h-1.5 rounded-full",
                                durationMinutes > 60 ? "bg-red-500" : durationMinutes > 30 ? "bg-orange-500" : "bg-blue-500"
                              )}
                              style={{ width: `${Math.min((durationMinutes / 120) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
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
            <Select value={newStatus || ticket.status} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(statusColors).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ")}
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
            <Button className="w-full" onClick={handleUpdateTicket}>
              <Edit3 className="w-4 h-4 mr-2" />
              Update Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
