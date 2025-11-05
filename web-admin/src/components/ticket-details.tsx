"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { User, Phone, MapPin, Clock, AlertCircle, Wrench, FileText, Camera, Edit3 } from "lucide-react"

interface TicketDetailsProps {
  ticketId: string
}

// Mock data - in real app this would come from API
const ticketData = {
  "TK-2024-001": {
    id: "TK-2024-001",
    customerId: "CUST-12345",
    customerName: "John Smith",
    phone: "+1 (555) 123-4567",
    serviceType: "Fiber 100Mbps",
    location: "123 Main St, Downtown",
    coordinates: "40.7128, -74.0060",
    sla: "4 hours",
    complaint: "No internet connection",
    status: "in-progress",
    priority: "high",
    technician: "Mike Johnson",
    issueTime: "2024-01-15 09:30",
    estimatedCompletion: "2024-01-15 13:30",
    rootCause: "Fiber cut",
    rootCauseDetails: "Construction work damaged fiber cable on Main St",
    wayToFix: "Replace damaged fiber section and re-splice connections",
    materialsUsed: [
      { item: "Fiber optic cable (50m)", cost: 150 },
      { item: "Splice enclosure", cost: 25 },
      { item: "Labor (2 hours)", cost: 200 },
    ],
    totalCost: 375,
    attachments: [
      { name: "damage_photo_1.jpg", type: "image" },
      { name: "repair_video.mp4", type: "video" },
    ],
    updates: [
      { time: "09:30", user: "System", message: "Ticket created" },
      { time: "09:45", user: "Mike Johnson", message: "Accepted ticket, heading to location" },
      { time: "10:15", user: "Mike Johnson", message: "On site, investigating issue" },
      { time: "10:30", user: "Mike Johnson", message: "Found fiber cut, ordering materials" },
    ],
  },
}

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
      <Card className="border-border/50">
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
        <CardContent className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Customer Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{ticket.customerName}</span>
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

          <Separator />

          {/* Issue Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Issue Details</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{ticket.complaint}</p>
                  <p className="text-sm text-muted-foreground">Service: {ticket.serviceType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">SLA: {ticket.sla}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Resolution Details */}
          {ticket.rootCause && (
            <>
              <div className="space-y-3">
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
              <Separator />
            </>
          )}

          {/* Materials & Cost */}
          {ticket.materialsUsed && (
            <>
              <div className="space-y-3">
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
              <Separator />
            </>
          )}

          {/* Attachments */}
          {ticket.attachments && (
            <>
              <div className="space-y-3">
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
              <Separator />
            </>
          )}

          {/* Status Update */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Update Status</h4>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
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
      <Card className="border-border/50">
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
