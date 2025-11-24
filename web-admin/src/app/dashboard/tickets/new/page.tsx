"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, User, Wifi, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function NewTicketPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    ticketId: "",
    customerId: "",
    customerName: "",
    phone: "",
    serviceType: "",
    splitter: "",
    complaint: "",
    priority: "",
    sla: "",
    description: "",
    technician: "",
    issueTime: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const parseTicketFromPaste = (pastedText: string) => {
    // Format: ticket id>> complaint description Customer ID Customer Name SLA ?hrs Splitter Information phone number issue date&time
    // Example: MMI 225110592>> Site Down M1CDWS00029001 Wai Wai Thein SOHO 24 hrs N9 OLT 0/1/12/58  09-440401401 22/11/2025 09:25
    
    const ticketPattern = /^([A-Z]{3}\s+\d+)\s*>>\s*(.+?)\s+(M1[A-Z0-9]+)\s+((?:HTK\s+)?[A-Z](?:[a-z]+|\s)+(?:\s+[A-Z][a-z]+)*)\s+(SOHO|Enterprise|Business|HTK)\s+(\d+)\s*hrs?\s+(N\d+\s+OLT\s+[\d/]+)\s+([\d\-/]+(?:\/[\d\-]+)?)\s+([\d/]+\s+[\d:]+)/i
    
    const match = pastedText.trim().match(ticketPattern)
    
    if (match) {
      const [
        ,
        ticketId,
        complaint,
        customerId,
        customerName,
        serviceType,
        slaHours,
        splitter,
        phone,
        issueDateTime
      ] = match

      // Map SLA hours to appropriate values
      let slaValue = ""
      const hours = parseInt(slaHours)
      if (hours <= 1) slaValue = "1-hour"
      else if (hours <= 2) slaValue = "2-hours"
      else if (hours <= 4) slaValue = "4-hours"
      else slaValue = "8-hours"

      // Map service type
      let serviceTypeValue = ""
      const serviceTypeLower = serviceType.toLowerCase()
      if (serviceTypeLower === "soho" || serviceTypeLower === "htk") serviceTypeValue = "fiber-100"
      else if (serviceTypeLower === "enterprise") serviceTypeValue = "fiber-enterprise"
      else if (serviceTypeLower === "business") serviceTypeValue = "fiber-500"

      // Determine priority based on complaint keywords
      let priority = "medium"
      const complaintLower = complaint.toLowerCase()
      if (complaintLower.includes("site down") || complaintLower.includes("down") || complaintLower.includes("outage")) {
        priority = "critical"
      } else if (complaintLower.includes("slow") || complaintLower.includes("degradation")) {
        priority = "high"
      }

      // Parse date and time to datetime-local format (YYYY-MM-DDTHH:mm)
      const dateTimeParts = issueDateTime.trim().match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
      let formattedDateTime = ""
      if (dateTimeParts) {
        const [, day, month, year, hour, minute] = dateTimeParts
        formattedDateTime = `${year}-${month}-${day}T${hour}:${minute}`
      }

      setFormData({
        ticketId: ticketId.trim(),
        customerId: customerId.trim(),
        customerName: customerName.trim(),
        phone: phone.trim(),
        serviceType: serviceTypeValue,
        splitter: splitter.trim(),
        complaint: complaint.trim(),
        priority: priority,
        sla: slaValue,
        description: `${complaint.trim()}\n\nIssue reported at: ${issueDateTime}`,
        technician: "",
        issueTime: formattedDateTime,
      })

      return true
    }
    
    return false
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text")
    
    if (parseTicketFromPaste(pastedText)) {
      e.preventDefault()
      // Show success message or notification here if needed
    }
  }

  const handleSubmit = (isDraft = false) => {
    console.log("[v0] Form submitted:", { ...formData, isDraft })
    // Here you would typically send the data to your API
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Ticket</h1>
            <p className="text-muted-foreground">Fill in the details for the new maintenance request</p>
          </div>
        </div>

        {/* Paste Area */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-950/50">
            <CardTitle className="text-purple-700 dark:text-purple-300">Quick Import from LINE</CardTitle>
            <CardDescription>Paste ticket information from LINE app to auto-fill the form</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Paste ticket information here (e.g., MMI 225110592>> Site Down M1CDWS00029001 Wai Wai Thein SOHO 24 hrs N9 OLT 0/1/12/58 09-440401401 22/11/2025 09:25)"
              rows={2}
              onPaste={handlePaste}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">Paste ticket info from LINE app to auto-fill all fields below</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
            {/* Customer and Service Information Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-blue-50 dark:bg-blue-950/50">
                  <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </CardTitle>
                  <CardDescription>Basic customer details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticketId">Ticket ID</Label>
                      <Input
                        id="ticketId"
                        placeholder="MMI 225110592"
                        value={formData.ticketId}
                        onChange={(e) => handleInputChange("ticketId", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerId">Customer ID</Label>
                      <Input
                        id="customerId"
                        placeholder="M1CDWS00029001"
                        value={formData.customerId}
                        onChange={(e) => handleInputChange("customerId", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        placeholder="John Smith"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange("customerName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="09-440401401"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-950/50">
                <CardTitle className="flex items-center text-green-700 dark:text-green-300">
                  <Wifi className="w-5 h-5 mr-2" />
                  Service Information
                </CardTitle>
                <CardDescription>Service type and location details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value) => handleInputChange("serviceType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiber-100">Fiber 100Mbps</SelectItem>
                        <SelectItem value="fiber-500">Fiber 500Mbps</SelectItem>
                        <SelectItem value="fiber-1gb">Fiber 1Gbps</SelectItem>
                        <SelectItem value="fiber-enterprise">Fiber Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sla">SLA Response Time</Label>
                    <Select value={formData.sla} onValueChange={(value) => handleInputChange("sla", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SLA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-hour">1 Hour (Critical)</SelectItem>
                        <SelectItem value="2-hours">2 Hours (High)</SelectItem>
                        <SelectItem value="4-hours">4 Hours (Medium)</SelectItem>
                        <SelectItem value="8-hours">8 Hours (Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="splitter">Splitter</Label>
                    <Input
                      id="splitter"
                      placeholder="N9 OLT 0/1/12/58"
                      value={formData.splitter}
                      onChange={(e) => handleInputChange("splitter", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueTime">Issue Date & Time</Label>
                    <Input
                      id="issueTime"
                      type="datetime-local"
                      value={formData.issueTime}
                      onChange={(e) => handleInputChange("issueTime", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              </Card>
            </div>

            {/* Issue Details */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-orange-50 dark:bg-orange-950/50">
                <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Issue Details
                </CardTitle>
                <CardDescription>Detailed description of the problem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="complaint">Issue Summary</Label>
                  <Input
                    id="complaint"
                    placeholder="Brief description of the issue"
                    value={formData.complaint}
                    onChange={(e) => handleInputChange("complaint", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the issue, symptoms, and any troubleshooting steps already taken..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="technician">Assign Technician</Label>
                    <Select
                      value={formData.technician}
                      onValueChange={(value) => handleInputChange("technician", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                        <SelectItem value="alex-chen">Alex Chen</SelectItem>
                        <SelectItem value="sarah-davis">Sarah Davis</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleSubmit(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit(false)} className="bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4 mr-2" />
                Create Ticket
              </Button>
            </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
