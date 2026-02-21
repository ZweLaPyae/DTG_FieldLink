"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload } from "lucide-react"
import mockDb from "../../mock_database.json"
import { useAdminId } from "@/hooks/useAdminId"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const { adminId } = useAdminId()
  const [formData, setFormData] = useState({
    ticketId: "",
    customerId: "",
    customerName: "",
    phone: "",
    serviceType: "",
    splitter: "",
    sla: "",
    complaint: "",
    priority: "",
    issueTime: "",
  })
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create FormData for multipart upload
      const submitData = new FormData()
      submitData.append('ticketId', formData.ticketId)
      submitData.append('customerId', formData.customerId)
      submitData.append('complaint', formData.complaint)
      submitData.append('sla', formData.sla)
      submitData.append('issueTime', formData.issueTime)
      submitData.append('priority', formData.priority)
      submitData.append('phone', formData.phone)
      submitData.append('serviceTypeId', formData.serviceType)
      submitData.append('splitter', formData.splitter)
      submitData.append('adminUserId', String(adminId))

      // Append media files
      mediaFiles.forEach((file) => {
        submitData.append('attachments', file)
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets`, {
        method: 'POST',
        body: submitData,
      })

      if (response.ok) {
        console.log("Ticket created successfully")
        onOpenChange(false)
        // Reset form
        setFormData({
          ticketId: "",
          customerId: "",
          customerName: "",
          phone: "",
          serviceType: "",
          splitter: "",
          sla: "",
          complaint: "",
          priority: "",
          issueTime: "",
        })
        setMediaFiles([])
        // Optionally refresh ticket list
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to create ticket: ${error.error}`)
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      alert("Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setMediaFiles((prev) => [...prev, ...files])
    }
  }

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>Fill in the details to create a new maintenance ticket</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticketId">Ticket ID</Label>
              <Input
                id="ticketId"
                value={formData.ticketId}
                onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                placeholder="TKT-20231122-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                placeholder="CUST-12345"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {mockDb.service_types.map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="splitter">Splitter Information</Label>
              <Input
                id="splitter"
                value={formData.splitter}
                onChange={(e) => setFormData({ ...formData, splitter: e.target.value })}
                placeholder="N9 OLT 0/1/12/58"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sla">SLA</Label>
              <Select value={formData.sla} onValueChange={(value) => setFormData({ ...formData, sla: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SLA" />
                </SelectTrigger>
                <SelectContent>
                  {mockDb.sla_options.map(sla => (
                    <SelectItem key={sla} value={sla}>{sla}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {mockDb.priorities.map(priority => (
                    <SelectItem key={priority.id} value={priority.id}>{priority.display}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complaint">Complaint Description</Label>
            <Textarea
              id="complaint"
              value={formData.complaint}
              onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
              placeholder="Describe the issue..."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueTime">Issue Date & Time</Label>
            <Input
              id="issueTime"
              type="datetime-local"
              value={formData.issueTime}
              onChange={(e) => setFormData({ ...formData, issueTime: e.target.value })}
              required
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Photos/Videos)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaChange}
                className="cursor-pointer"
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            {mediaFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-muted-foreground">Selected files:</p>
                <div className="space-y-1">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMediaFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
