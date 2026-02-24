"use client"

import { useEffect, useState } from "react"
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
import { useAdminId } from "@/hooks/useAdminId"

export default function NewTicketPage() {
  const router = useRouter()
  const { adminId } = useAdminId()
  const [formData, setFormData] = useState({
    ticketId: "",
    customerId: "",
    customerName: "",
    phone: "",
    serviceTypeId: "",
    splitter: "",
    complaint: "",
    priority: "",
    teamId: "",
    issueTime: "",
  })
  const [serviceTypes, setServiceTypes] = useState<{ id: string; name: string; speedMbps: number }[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [priorityOptions, setPriorityOptions] = useState<{ id: string; display: string }[]>([])
  const [customerSearch, setCustomerSearch] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // When customer is selected, auto-fill customer details
    if (field === "customerId" && value) {
      const selectedCustomer = customers.find(c => c.id === value)
      if (selectedCustomer) {
        setFormData((prev) => ({
          ...prev,
          customerId: value,
          customerName: selectedCustomer.name || "",
          phone: selectedCustomer.phone?.[0] || "",
          serviceTypeId: selectedCustomer.serviceTypeId || "",
          splitter: selectedCustomer.splitter || "",
        }))
      }
    }
  }

  const parseTicketFromPaste = (pastedText: string) => {
    // Format: ticket id>> complaint description Customer ID Customer Name Service Type ?hrs Splitter Information phone number issue date&time
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
        serviceTypeId,
        , // Skip SLA hours field
        splitter,
        phone,
        issueDateTime
      ] = match

      // Map service type
      let serviceTypeValue = ""
      const serviceTypeLower = serviceTypeId.toLowerCase()
      if (serviceTypeLower === "soho" || serviceTypeLower === "htk") serviceTypeValue = "soho"
      else if (serviceTypeLower === "enterprise") serviceTypeValue = "fiber-enterprise"
      else if (serviceTypeLower === "business") serviceTypeValue = "fiber-500"
      // Determine priority based on complaint keywords
      let priority = "normal"
      const complaintLower = complaint.toLowerCase()
      if (complaintLower.includes("site down") || complaintLower.includes("down") || complaintLower.includes("outage") || complaintLower.includes("urgent")) {
        priority = "urgent"
      }

    // Format date/time to datetime-local (YYYY-MM-DDTHH:mm)
    const dateTimeParts = issueDateTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
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
        serviceTypeId: serviceTypeId,
        splitter: splitter.trim(),
        complaint: complaint.trim(),
        priority: priority,
        teamId: "",
        issueTime: formattedDateTime,
      })

      return true
    }

    return false
  }
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/service-type"
        )

        if (!res.ok) {
          throw new Error("Failed to fetch service types")
        }

        const data = await res.json()
        setServiceTypes(data)
      } catch (error) {
        console.error("Error fetching service types:", error)
      }
    }

    const fetchTeams = async () => {
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/teams"
        )

        if (!res.ok) {
          throw new Error("Failed to fetch teams")
        }

        const data = await res.json()
        setTeams(data)
      } catch (error) {
        console.error("Error fetching teams:", error)
      }
    }

    const fetchCustomers = async () => {
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/customers"
        )

        if (!res.ok) {
          throw new Error("Failed to fetch customers")
        }

        const data = await res.json()
        setCustomers(data)
      } catch (error) {
        console.error("Error fetching customers:", error)
      }
    }

    const fetchPriorityOptions = async () => {
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/priority"
        )

        if (!res.ok) {
          throw new Error("Failed to fetch priority options")
        }

        const data = await res.json()
        setPriorityOptions(data)
      } catch (error) {
        console.error("Error fetching priority options:", error)
      }
    }

    fetchServiceTypes()
    fetchTeams()
    fetchCustomers()
    fetchPriorityOptions()
  }, [])


  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text")

    if (parseTicketFromPaste(pastedText)) {
      e.preventDefault()
      // Show success message or notification here if needed
    }
  }

  const handleSubmit = async (isDraft = false) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...formData, 
          isDraft,
          adminUserId: adminId,
          priority: formData.priority,
          issueTime: formData.issueTime,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Ticket created:', result);
        router.push('/dashboard'); // Redirect to the dashboard after creation
      } else {
        const error = await response.json();
        console.error('Error creating ticket:', error);
        alert(`Failed to create ticket: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error: Failed to create ticket');
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
              placeholder="Paste ticket information here (e.g., MMI 225110592>> Site Down M1CDWS00029001 Wai Wai Thein SOHO 24 hrs N9 OLT 0/1/12/58  09-440401401 22/11/2025 09:25)"
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
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => handleInputChange("customerId", value)}
                      onOpenChange={(open) => {
                        if (!open) setCustomerSearch("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-2 sticky top-0 bg-background z-10">
                          <Input
                            placeholder="Search customers..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {customers
                            .filter((customer) => {
                              const searchLower = customerSearch.toLowerCase()
                              return (
                                customer.id.toLowerCase().includes(searchLower) ||
                                customer.name.toLowerCase().includes(searchLower)
                              )
                            })
                            .map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.id} - {customer.name}
                              </SelectItem>
                            ))}
                          {customers.filter((customer) => {
                            const searchLower = customerSearch.toLowerCase()
                            return (
                              customer.id.toLowerCase().includes(searchLower) ||
                              customer.name.toLowerCase().includes(searchLower)
                            )
                          }).length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No customers found
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Auto-filled from customer selection"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Auto-filled from customer selection"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      disabled
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
                      value={formData.serviceTypeId}
                      onValueChange={(value) => handleInputChange("serviceTypeId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange("priority", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.id} value={priority.id}>
                          {priority.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamId">Assign Team</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => handleInputChange("teamId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name} (Leader: {team.leader?.name || 'N/A'})
                        </SelectItem>
                      ))}
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
