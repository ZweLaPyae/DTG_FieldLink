"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, User, Wifi } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function NewCustomerPage() {
  const router = useRouter()
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

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/service-type`)
        if (res.ok) {
          const data = await res.json()
          setServiceTypes(data)
        }
      } catch (error) {
        console.error("Error fetching service types:", error)
      }
    }
    fetchServiceTypes()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.id.trim() || !formData.name.trim()) {
      alert("Customer ID and Name are required")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim() ? [formData.phone.trim()] : [],
        serviceTypeId: formData.serviceTypeId || null,
        splitter: formData.splitter.trim() || null,
        splitterMap: formData.splitterMap.trim() || null,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/customers")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || "Failed to create customer"}`)
      }
    } catch (err) {
      console.error("Network error:", err)
      alert("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
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
            <h1 className="text-2xl font-bold text-foreground">Create New Customer</h1>
            <p className="text-muted-foreground">Add a new customer record to the system</p>
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
                  <Label htmlFor="id">
                    Customer ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id"
                    placeholder="M1CDWS00029001"
                    value={formData.id}
                    onChange={(e) => handleInputChange("id", e.target.value)}
                    required
                  />
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
              {isSubmitting ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
