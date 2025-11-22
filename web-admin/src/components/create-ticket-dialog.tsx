"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import mockDb from "../../mock_database.json"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Creating ticket:", formData)
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Ticket</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
