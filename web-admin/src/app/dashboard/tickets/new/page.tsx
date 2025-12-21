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
    phone: [""],
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

  const handlePhoneChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newPhone = [...prev.phone]
      newPhone[index] = value
      return { ...prev, phone: newPhone }
    })
  }

  const addPhoneNumber = () => {
    // Only add if the last phone number is filled
    const lastPhone = formData.phone[formData.phone.length - 1]
    if (lastPhone && lastPhone.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        phone: [...prev.phone, ""]
      }))
    }
  }

  const removePhoneNumber = (index: number) => {
    if (formData.phone.length > 1) {
      setFormData((prev) => ({
        ...prev,
        phone: prev.phone.filter((_, i) => i !== index)
      }))
    }
  }

  const parseTicketFromPaste = (pastedText: string) => {
    // Pattern-based extraction - each field has unique characteristics
    // Works regardless of which fields are missing
    
    const text = pastedText.trim()
    
    // 1. Extract Ticket ID: 3 letters + space + numbers + ">>"
    const ticketMatch = text.match(/^([A-Z]{3}\s+\d+)\s*>>/i)
    if (!ticketMatch) return false
    const ticketId = ticketMatch[1].trim()
    
    // 2. Extract Date/Time: DD/MM/YYYY HH:mm format
    const dateTimeMatch = text.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/)
    const issueDateTime = dateTimeMatch ? dateTimeMatch[1] : ""
    
    // 3. Extract Phone: 8-12 digits with optional dashes, separated by /
    const phoneMatch = text.match(/(\d[\d\-]{7,11}(?:\/\d[\d\-]{7,11})*)(?=\s+\d{2}\/\d{2}\/\d{4})/)
    const phoneNumbers = phoneMatch ? phoneMatch[1].split('/').map(p => p.trim()).filter(p => {
      const digitCount = p.replace(/\D/g, '').length
      return digitCount >= 8 && digitCount <= 12
    }) : []
    
    // 4. Extract Splitter: N + digit + OLT + numbers/slashes
    const splitterMatch = text.match(/(N\d+\s+OLT\s+[\d\/]+)/)
    const splitter = splitterMatch ? splitterMatch[1].trim() : ""
    
    // 5. Extract SLA: number + hrs/hr
    const slaMatch = text.match(/(\d+)\s*hrs?(?:\s|$)/i)
    const slaHours = slaMatch ? parseInt(slaMatch[1]) : 24
    
    // 6. Extract Service Type: SOHO, Enterprise, Business, or HTK (but not when part of customer name)
    const serviceTypeMatch = text.match(/\b(SOHO|Enterprise|Business)\b/i)
    const serviceType = serviceTypeMatch ? serviceTypeMatch[1] : ""
    
    // 7. Extract Customer ID: Mix of letters and numbers
    const customerIdMatch = text.match(/\b([A-Z]+\d+[A-Z0-9]+)\b/)
    const customerId = customerIdMatch ? customerIdMatch[1] : ""
    
    // 8. Extract Customer Name: 2-5 capitalized words (may have HTK or U prefix)
    // Must come after customer ID and before service type
    let customerName = ""
    if (customerIdMatch) {
      const afterCustomerId = text.slice(customerIdMatch.index! + customerIdMatch[0].length).trim()
      const nameMatch = afterCustomerId.match(/^((?:HTK\s+)?(?:U\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})(?=\s+(?:SOHO|Enterprise|Business))/i)
      if (nameMatch) {
        customerName = nameMatch[1].trim()
      }
    }
    
    // 9. Extract Complaint: Everything between ">>" and customer ID (or first recognizable field)
    let complaint = ""
    const afterTicketId = text.slice(text.indexOf(">>") + 2).trim()
    
    if (customerIdMatch) {
      // Get text from after ">>" to before customer ID
      complaint = afterTicketId.slice(0, afterTicketId.indexOf(customerIdMatch[0])).trim()
    } else {
      // If no customer ID, remove all other patterns
      let remainingText = afterTicketId
      if (dateTimeMatch) remainingText = remainingText.replace(dateTimeMatch[0], "")
      if (phoneMatch) remainingText = remainingText.replace(phoneMatch[0], "")
      if (splitterMatch) remainingText = remainingText.replace(splitterMatch[0], "")
      if (slaMatch) remainingText = remainingText.replace(slaMatch[0], "")
      if (serviceTypeMatch) remainingText = remainingText.replace(serviceTypeMatch[0], "")
      complaint = remainingText.trim()
    }

    // Map SLA hours to dropdown values
    let slaValue = ""
    if (slaHours <= 1) slaValue = "1-hour"
    else if (slaHours <= 2) slaValue = "2-hours"
    else if (slaHours <= 4) slaValue = "4-hours"
    else slaValue = "8-hours"

    // Map service type to dropdown values
    let serviceTypeValue = ""
    if (serviceType) {
      const serviceTypeLower = serviceType.toLowerCase()
      if (serviceTypeLower === "soho" || serviceTypeLower === "htk") serviceTypeValue = "fiber-100"
      else if (serviceTypeLower === "enterprise") serviceTypeValue = "fiber-enterprise"
      else if (serviceTypeLower === "business") serviceTypeValue = "fiber-500"
    }

    // Determine priority from complaint keywords
    let priority = "medium"
    const complaintLower = complaint.toLowerCase()
    if (complaintLower.includes("site down") || complaintLower.includes("down") || complaintLower.includes("outage")) {
      priority = "critical"
    } else if (complaintLower.includes("slow") || complaintLower.includes("degradation")) {
      priority = "high"
    }

    // Format date/time to datetime-local (YYYY-MM-DDTHH:mm)
    const dateTimeParts = issueDateTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
    let formattedDateTime = ""
    if (dateTimeParts) {
      const [, day, month, year, hour, minute] = dateTimeParts
      formattedDateTime = `${year}-${month}-${day}T${hour}:${minute}`
    }

    // Update only fields that were found
    setFormData((prev) => ({
      ...prev,
      ...(ticketId && { ticketId }),
      ...(customerId && { customerId }),
      ...(customerName && { customerName }),
      ...(phoneNumbers.length > 0 && { phone: phoneNumbers }),
      ...(serviceTypeValue && { serviceType: serviceTypeValue }),
      ...(splitter && { splitter }),
      ...(complaint && { 
        complaint,
        description: `${complaint}${issueDateTime ? `\n\nIssue reported at: ${issueDateTime}` : ""}`
      }),
      ...(priority && { priority }),
      ...(slaValue && { sla: slaValue }),
      ...(formattedDateTime && { issueTime: formattedDateTime }),
    }))

    return true
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text")
    
    if (parseTicketFromPaste(pastedText)) {
      e.preventDefault()
      // Show success message or notification here if needed
    }
  }

  const handleSubmit = async (isDraft = false) => {
    try {
      const response = await fetch('http://localhost:3000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, isDraft }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Ticket created:', result);
        router.push('/dashboard'); // Redirect to the dashboard after creation
      } else {
        const error = await response.json();
        console.error('Error creating ticket:', error);
      }
    } catch (err) {
      console.error('Network error:', err);
    }
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
                      <div className="flex items-center justify-between">
                        <Label>Phone Number(s)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addPhoneNumber}
                          disabled={!formData.phone[formData.phone.length - 1]?.trim()}
                          className="h-7 text-xs"
                        >
                          Add +
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.phone.map((phoneNum, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="09-440401401"
                              value={phoneNum}
                              onChange={(e) => handlePhoneChange(index, e.target.value)}
                              required={index === 0}
                            />
                            {formData.phone.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePhoneNumber(index)}
                                className="px-3"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
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
