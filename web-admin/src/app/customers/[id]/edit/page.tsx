"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, User, Wifi } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    serviceTypeId: "",
    splitter: "",
    splitterMap: "",
  })
  const [serviceTypes, setServiceTypes] = useState<{ id: string; name: string; speedMbps: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customer data
        const customerRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/customers/${customerId}`)
        if (customerRes.ok) {
          const customer = await customerRes.json()
          setFormData({
            id: customer.id || "",
            name: customer.name || "",
            phone: customer.phone?.[0] || "",
            serviceTypeId: customer.serviceTypeId || "",
            splitter: customer.splitter || "",
            splitterMap: customer.splitterMap || "",
          })
        }

        // Fetch service types
        const serviceRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/service-type`)
        if (serviceRes.ok) {
          const data = await serviceRes.json()
          setServiceTypes(data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [customerId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("Customer Name is required")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() ? [formData.phone.trim()] : [],
        serviceTypeId: formData.serviceTypeId || null,
        splitter: formData.splitter.trim() || null,
        splitterMap: formData.splitterMap.trim() || null,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/customers")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || "Failed to update customer"}`)
      }
    } catch (err) {
      console.error("Network error:", err)
      alert("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading customer data...</div>
        </div>
      </DashboardLayout>
    )
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
            <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
            <p className="text-muted-foreground">Update customer information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="space-y-2">
                  <Label htmlFor="id">Customer ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Customer ID cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
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
                  />
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
                <CardDescription>Service type and location details (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={formData.serviceTypeId} onValueChange={(value) => handleInputChange("serviceTypeId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.speedMbps} Mbps)
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="splitterMap">Splitter Map</Label>
                  <Input
                    id="splitterMap"
                    placeholder="Splitter map information"
                    value={formData.splitterMap}
                    onChange={(e) => handleInputChange("splitterMap", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Updating..." : "Update Customer"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
