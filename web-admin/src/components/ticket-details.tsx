"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { User, Phone, MapPin, Clock, AlertCircle, Wrench, FileText, Camera, Edit3 } from "lucide-react"
import mockDb from "../../mock_database.json"

interface TicketDetailsProps {
  ticketId: string
}

const ticketData = mockDb.tickets.reduce((acc, ticket) => {
  acc[ticket.id] = ticket
  return acc
}, {} as Record<string, typeof mockDb.tickets[0]>)

export function TicketDetails({ ticketId }: TicketDetailsProps) {
  const [newUpdate, setNewUpdate] = useState("")
  const [newStatus, setNewStatus] = useState("")

  const ticket = ticketData[ticketId as keyof typeof ticketData]

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
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{ticket.id}</CardTitle>
            <div className="flex space-x-2">
              <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                {ticket.status.replace("-", " ")}
              </Badge>
              <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                {ticket.priority}
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
                <span className="font-medium">{ticket.customerName_display}</span>
                <span className="text-sm text-muted-foreground">({ticket.customerId})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{ticket.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{ticket.location}</span>
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
                  <p className="text-sm text-muted-foreground">Service: {ticket.serviceType_display}</p>
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
                      <p className="font-medium">Root Cause: {ticket.rootCause}</p>
                      <p className="text-sm text-muted-foreground">{ticket.rootCauseDetails}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Solution</p>
                      <p className="text-sm text-muted-foreground">{ticket.wayToFix}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Materials & Cost */}
          {ticket.materialsUsed && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Materials & Cost
                </h4>
                <div className="space-y-2">
                  {ticket.materialsUsed.map((material, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{material.item}</span>
                      <span className="font-medium">${material.cost}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Cost</span>
                    <span className="text-primary">${ticket.totalCost}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Attachments */}
          {ticket.attachments && (
            <>
              <div className="space-y-3 col-span-2 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Attachments</h4>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-primary cursor-pointer hover:underline">{attachment.name}</span>
                    </div>
                  ))}
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
            {ticket.updates.map((update, index) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
