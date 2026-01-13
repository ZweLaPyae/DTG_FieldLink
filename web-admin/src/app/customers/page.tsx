"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

interface Customer {
  id: string
  name: string
  phone: string[]
  serviceTypeId?: string
  splitter?: string
  serviceType?: {
    id: string
    name: string
    speedMbps: number
  }
  _count?: {
    tickets: number
  }
}

type SortField = "id" | "name" | "tickets"
type SortOrder = "asc" | "desc"

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/customers`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/customers/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />
    return sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />
  }

  const filteredAndSortedCustomers = customers
    .filter(
      (customer) =>
        customer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      
      if (sortField === "id") {
        comparison = a.id.localeCompare(b.id)
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === "tickets") {
        const aCount = a._count?.tickets || 0
        const bCount = b._count?.tickets || 0
        comparison = aCount - bCount
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
              Customer Management
            </h1>
            <p className="text-muted-foreground mt-1">Create, view, edit, and manage customer records</p>
          </div>
          <Button onClick={() => router.push("/customers/new")} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Search and Filter Card */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Search Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by Customer ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">
              All Customers ({filteredAndSortedCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No customers found matching your search" : "No customers yet. Create your first one!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        <button onClick={() => handleSort("id")} className="flex items-center hover:text-primary">
                          Customer ID
                          {getSortIcon("id")}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        <button onClick={() => handleSort("name")} className="flex items-center hover:text-primary">
                          Name
                          {getSortIcon("name")}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Service Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Splitter</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        <button onClick={() => handleSort("tickets")} className="flex items-center hover:text-primary">
                          Tickets
                          {getSortIcon("tickets")}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{customer.id}</td>
                        <td className="py-3 px-4 font-medium">{customer.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {Array.isArray(customer.phone) ? customer.phone.join(", ") : customer.phone || "—"}
                        </td>
                        <td className="py-3 px-4">
                          {customer.serviceType ? (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
                              {customer.serviceType.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                          {customer.splitter || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                            {customer._count?.tickets || 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/customers/${customer.id}/edit`)}
                              className="hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              className="hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
