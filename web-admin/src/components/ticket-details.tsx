"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { User, Phone, MapPin, Clock, AlertCircle, Wrench, FileText, Camera, Edit3, CheckCircle, Image as ImageIcon, Video, Users, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminId } from "@/hooks/useAdminId"

interface TicketDetailsProps {
  ticketId: string
  isSelected?: boolean
  onTicketUpdate?: () => void
  onTicketDelete?: () => void
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
  teamId?: number | null
  attachments?: Array<{
    name: string
    type: string
  }>
  updates: any
  technicianCompletionTime?: string | null
  technicianNote?: string | null
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
  team?: {
    id: number
    name: string
    leaderId: number
    leader: {
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

export function TicketDetails({ ticketId, isSelected = false, onTicketUpdate, onTicketDelete }: TicketDetailsProps) {
  const { adminId, isLoading: isAdminLoading } = useAdminId()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newUpdate, setNewUpdate] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)

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
          // Set selected team if ticket has one
          if (data.teamId) {
            setSelectedTeamId(data.teamId.toString())
          } else {
            setSelectedTeamId("")
          }
        }
      } catch (error) {
        console.error("Error fetching ticket:", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (ticketId) {
      // Reset form fields when switching tickets
      setNewUpdate("")
      setNewStatus("")
      setSelectedTeamId("")
      fetchTicket()
    }
  }, [ticketId])

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams`)
        if (response.ok) {
          const data = await response.json()
          setTeams(data)
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      }
    }
    fetchTeams()
  }, [])

  const handleUpdateTicket = async () => {
    try {
      const updateData: any = {};
      
      // Only include status if it was changed
      if (newStatus && newStatus !== ticket?.status) {
        updateData.status = newStatus;
      }

      // Include team assignment if changed
      const currentTeamId = ticket?.teamId?.toString() || "";
      if (selectedTeamId !== currentTeamId) {
        if (selectedTeamId === "none" || selectedTeamId === "") {
          updateData.teamId = null; // Unassign team
        } else {
          updateData.teamId = parseInt(selectedTeamId);
        }
      }

      // Include admin note if provided
      if (newUpdate && newUpdate.trim()) {
        if (!adminId) {
          console.error('Cannot add notes: Admin ID not available');
          return;
        }
        updateData.adminNote = newUpdate.trim();
        updateData.adminUserId = adminId;
      }

      // If there's nothing to update, return early
      if (Object.keys(updateData).length === 0) {
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Re-fetch the ticket to get enriched data (materials with names, etc.)
        const getResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`);
        if (getResponse.ok) {
          const enrichedTicket = await getResponse.json();
          setTicket(enrichedTicket);
          // Update selected team to match the ticket
          if (enrichedTicket.teamId) {
            setSelectedTeamId(enrichedTicket.teamId.toString());
          } else {
            setSelectedTeamId("");
          }
        }
        setNewStatus("");
        setNewUpdate("");
        // Notify parent to refresh the ticket list
        if (onTicketUpdate) {
          onTicketUpdate();
        }
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm(`Are you sure you want to delete ticket ${ticketId}? This action cannot be undone.`)) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUserId: adminId,
        }),
      })

      if (response.ok || response.status === 204) {
        // Notify parent to refresh and clear selection
        if (onTicketDelete) {
          onTicketDelete()
        }
        if (onTicketUpdate) {
          onTicketUpdate()
        }
      } else {
        const error = await response.json()
        alert(`Failed to delete ticket: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error deleting ticket:", error)
      alert('Network error: Failed to delete ticket')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCompleteTicket = async () => {
    try {
      setIsCompleting(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          // Backend will use server-side timestamp for completionTime
          adminUserId: adminId,
        }),
      });
      if (response.ok) {
        // Re-fetch the ticket
        const getResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}`);
        if (getResponse.ok) {
          const enrichedTicket = await getResponse.json();
          setTicket(enrichedTicket);
        }
        // Notify parent to refresh the ticket list
        if (onTicketUpdate) {
          onTicketUpdate();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete ticket');
      }
    } catch (error) {
      console.error("Error completing ticket:", error);
      alert('Failed to complete ticket');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentUrl: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketId}/attachments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attachment: attachmentUrl, requesterType: 'admin' }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTicket((prev) => (prev ? { ...prev, attachments: updated.attachments } : prev));
        if (onTicketUpdate) {
          onTicketUpdate();
        }
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Network error: failed to delete attachment');
    }
  };

  // Calculate total hours and working hours
  const calculateHours = () => {
    if (!ticket?.startTime || !ticket?.completionTime) {
      return { totalHours: null, workingHours: null, hasTimingIssue: false, timingIssueMessage: null }
    }

    const startTime = new Date(ticket.startTime)
    const completionTime = new Date(ticket.completionTime)

    // Check for timing inconsistencies
    let hasTimingIssue = false
    let timingIssueMessage = null

    if (completionTime < startTime) {
      hasTimingIssue = true
      timingIssueMessage = `⚠️ Timing Error: Completion time is ${Math.abs((completionTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(2)} hours BEFORE start time. This may indicate incorrect system time on the device used for completion.`
    }

    // Calculate total hours (in hours with 2 decimal places)
    const totalHours = (completionTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Calculate break time total (in hours)
    let breakTimeHours = 0
    if (ticket.breakTimes && Array.isArray(ticket.breakTimes)) {
      breakTimeHours = ticket.breakTimes.reduce((total, breakTime) => {
        const breakStart = new Date(breakTime.start)
        const breakEnd = new Date(breakTime.end)
        const breakDuration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60)
        return total + breakDuration
      }, 0)
    }

    // Calculate working hours
    const workingHours = totalHours - breakTimeHours

    return {
      totalHours: totalHours.toFixed(2),
      workingHours: workingHours.toFixed(2),
      hasTimingIssue,
      timingIssueMessage
    }
  }

  const { totalHours, workingHours, hasTimingIssue, timingIssueMessage } = calculateHours()

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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                {ticket.status.replace("_", " ")}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteTicket}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                title="Delete ticket"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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

            {/* Timing Issue Warning */}
            {hasTimingIssue && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">Timing Inconsistency Detected</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{timingIssueMessage}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{ticket.complaint}</p>
                  <p className="text-sm text-muted-foreground">Service: {ticket.customer?.serviceType?.name || "-"}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-1 text-sm">
                <span className="text-muted-foreground">Issue Time: <span className="text-foreground">{new Date(ticket.issueTime).toLocaleString('en-US', { timeZone: 'Asia/Yangon', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></span>
                {ticket.startTime && (
                  <span className="text-muted-foreground">Start Time: <span className="text-foreground">{new Date(ticket.startTime).toLocaleString('en-US', { timeZone: 'Asia/Yangon', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></span>
                )}
                {ticket.technicianCompletionTime && (
                  <span className="text-muted-foreground">Technician Completed: <span className="text-foreground">{new Date(ticket.technicianCompletionTime).toLocaleString('en-US', { timeZone: 'Asia/Yangon', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></span>
                )}
                {ticket.completionTime && (
                  <span className="text-muted-foreground">Admin Completed: <span className="text-foreground">{new Date(ticket.completionTime).toLocaleString('en-US', { timeZone: 'Asia/Yangon', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></span>
                )}
                {totalHours && (
                  <span className={cn(
                    "text-muted-foreground",
                    hasTimingIssue && "text-red-600 dark:text-red-400 font-semibold"
                  )}>
                    Total Hours: <span className={cn(
                      "text-foreground font-medium",
                      hasTimingIssue && "text-red-700 dark:text-red-300"
                    )}>{totalHours} hrs</span>
                  </span>
                )}
                {workingHours && (
                  <span className={cn(
                    "text-muted-foreground",
                    hasTimingIssue && "text-red-600 dark:text-red-400 font-semibold"
                  )}>
                    Working Hours: <span className={cn(
                      "text-foreground font-medium",
                      hasTimingIssue && "text-red-700 dark:text-red-300"
                    )}>{workingHours} hrs</span>
                  </span>
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
                          {material.cost && (
                            <span className="font-medium">MMK{material.cost.toFixed(2)}</span>
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

          {/* Attachments (Photos/Videos from Technicians) */}
          {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
            <>
              <div className="space-y-3 col-span-4 shadow-sm p-4 rounded-md border border-border/50">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Fault Media (from Technician)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="relative group">
                      {attachment.type === 'image' ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
                          <img
                            src={attachment.name}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(attachment.name, '_blank')}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              className="bg-black/60 rounded-full p-1 hover:bg-black/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAttachment(attachment.name);
                              }}
                              title="Delete attachment"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                            <div className="bg-black/50 rounded-full p-1">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : attachment.type === 'video' ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
                          <video
                            src={attachment.name}
                            className="w-full h-full object-cover cursor-pointer"
                            controls
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              className="bg-black/60 rounded-full p-1 hover:bg-black/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAttachment(attachment.name);
                              }}
                              title="Delete attachment"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                            <div className="bg-black/50 rounded-full p-1">
                              <Video className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {attachment.type === 'image' ? 'Photo' : 'Video'} {index + 1}
                      </p>
                    </div>
                  ))}
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

          {/* Technician Notes */}
          {ticket.technicianNote && (
            <>
              <div className="space-y-3 col-span-4 shadow-sm p-4 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wide flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Technician Notes
                </h4>
                <div className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border border-border/50">
                  {ticket.technicianNote}
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
                    const start = new Date(breakTime.start).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                    const end = new Date(breakTime.end).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                    
                    return (
                      <div key={idx} className="flex flex-col border rounded p-2 bg-muted/10">
                        {breakTime.reason && <span className="font-medium">Reason: {breakTime.reason}</span>}
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
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Update Ticket</h4>
            
            {/* Complete Ticket Button for IN_REVIEW status */}
            {ticket.status === 'IN_REVIEW' && (
              <Button 
                className="w-full mb-4" 
                onClick={handleCompleteTicket}
                disabled={isCompleting}
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isCompleting ? 'Completing...' : 'Complete Ticket'}
              </Button>
            )}

            {/* Current Team Display */}
            {ticket.team && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Current Team</p>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
                    {ticket.team.name} (Leader: {ticket.team.leader.name})
                  </p>
                </div>
              </div>
            )}

            {/* Team Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assign Team
              </label>
              <Select 
                value={selectedTeamId || (ticket.teamId?.toString() || "none")} 
                onValueChange={setSelectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground italic">No Team (Unassign)</span>
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedTeamId === "none" || selectedTeamId === "" 
                  ? "Ticket will be unassigned and visible to all technicians"
                  : selectedTeamId !== (ticket.teamId?.toString() || "")
                  ? "Team will be changed when you click Update Ticket"
                  : "Current team assignment"}
              </p>
            </div>

            <Separator />

            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Change Status</label>
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
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Add Admin Notes</label>
              <Textarea
                placeholder="Add update notes (optional)..."
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleUpdateTicket}
              disabled={isAdminLoading || (!!newUpdate.trim() && !adminId)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Update Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
