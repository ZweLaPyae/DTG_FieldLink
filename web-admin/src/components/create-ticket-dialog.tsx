"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    phone: "",
    serviceType: "",
    location: "",
    sla: "",
    complaint: "",
    priority: "",
    technician: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Creating ticket:", formData)
    onOpenChange(false)
    // Reset form
    setFormData({
      customerId: "",
      customerName: "",
      phone: "",
      serviceType: "",
      location: "",
      sla: "",
      complaint: "",
      priority: "",
      technician: "",
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
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                placeholder="CUST-12345"
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="fiber-100">Fiber 100Mbps</SelectItem>
                  <SelectItem value="fiber-200">Fiber 200Mbps</SelectItem>
                  <SelectItem value="fiber-500">Fiber 500Mbps</SelectItem>
                  <SelectItem value="fiber-1gb">Fiber 1Gbps</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="123 Main St, Downtown"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sla">SLA</Label>
              <Select value={formData.sla} onValueChange={(value) => setFormData({ ...formData, sla: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SLA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-hour">1 hour</SelectItem>
                  <SelectItem value="2-hours">2 hours</SelectItem>
                  <SelectItem value="4-hours">4 hours</SelectItem>
                  <SelectItem value="6-hours">6 hours</SelectItem>
                  <SelectItem value="24-hours">24 hours</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
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
            <Label htmlFor="technician">Assign Technician</Label>
            <Select
              value={formData.technician}
              onValueChange={(value) => setFormData({ ...formData, technician: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                <SelectItem value="alex-chen">Alex Chen</SelectItem>
                <SelectItem value="david-lee">David Lee</SelectItem>
                <SelectItem value="sarah-wilson">Sarah Wilson</SelectItem>
              </SelectContent>
            </Select>
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
