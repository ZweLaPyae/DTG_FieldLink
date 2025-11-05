"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, MapPin, Phone, User, Wifi, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function NewTicketPage() {
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    phone: "",
    email: "",
    serviceType: "",
    location: "",
    complaint: "",
    priority: "",
    sla: "",
    description: "",
    technician: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (isDraft = false) => {
    console.log("[v0] Form submitted:", { ...formData, isDraft })
    // Here you would typically send the data to your API
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/tickets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tickets
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Ticket</h1>
              <p className="text-muted-foreground">Fill in the details for the new maintenance request</p>
            </div>
          </div>
          <div className="flex space-x-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
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
                    <Label htmlFor="customerId">Customer ID</Label>
                    <Input
                      id="customerId"
                      placeholder="CUST-12345"
                      value={formData.customerId}
                      onChange={(e) => handleInputChange("customerId", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="John Smith"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.smith@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
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
              <CardContent className="space-y-4 pt-6">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Service Location</Label>
                  <Input
                    id="location"
                    placeholder="123 Main St, Downtown, City, State, ZIP"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

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
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-purple-50 dark:bg-purple-950/50">
                <CardTitle className="text-purple-700 dark:text-purple-300">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Location Map
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Customer
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Clock className="w-4 h-4 mr-2" />
                  Check Service History
                </Button>
              </CardContent>
            </Card>

            {/* Priority Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Priority Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    Critical
                  </Badge>
                  <span className="text-xs text-muted-foreground">Complete outage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                    High
                  </Badge>
                  <span className="text-xs text-muted-foreground">Severe degradation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Medium
                  </Badge>
                  <span className="text-xs text-muted-foreground">Minor issues</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                    Low
                  </Badge>
                  <span className="text-xs text-muted-foreground">Enhancement requests</span>
                </div>
              </CardContent>
            </Card>

            {/* SLA Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SLA Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Critical:</span>
                  <span className="font-medium">1 Hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span className="font-medium">2 Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medium:</span>
                  <span className="font-medium">4 Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span className="font-medium">8 Hours</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
