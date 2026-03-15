"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TicketList } from "@/components/ticket-list"
import { TicketDetails } from "@/components/ticket-details"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"

export default function TicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("IN_REVIEW")
  const [refreshKey, setRefreshKey] = useState(0)

  // Date filter states - default to past 7 days
  const getDefaultDates = () => {
    const today = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 7)
    return {
      start: sevenDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    }
  }
  const defaultDates = getDefaultDates()
  const [startDate, setStartDate] = useState(defaultDates.start)
  const [endDate, setEndDate] = useState(defaultDates.end)

  // Auto-select ticket from query parameter
  useEffect(() => {
    const ticketId = searchParams.get('selected')
    const customerId = searchParams.get('customerId')
    const customerName = searchParams.get('customerName')
    
    if (ticketId) {
      setSelectedTicket(ticketId)
    }
    
    if (customerName) {
      setSearchQuery(customerName)
    } else if (customerId) {
      setSearchQuery(customerId)
    }
  }, [searchParams])

  const handleTicketUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleTicketDelete = () => {
    setSelectedTicket(null) // Clear selection
    setRefreshKey(prev => prev + 1) // Refresh the list
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tickets</h1>
            <p className="text-muted-foreground">Manage and track maintenance tickets</p>
          </div>
          <Button onClick={() => router.push("/dashboard/tickets/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 h-[calc(100vh-180px)] overflow-y-auto px-2 py-1">
            <TicketList
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              startDate={startDate}
              endDate={endDate}
              selectedTicket={selectedTicket}
              onSelectTicket={setSelectedTicket}
              refreshKey={refreshKey}
              onTicketDelete={handleTicketDelete}
            />
          </div>
          <div className="lg:col-span-3 h-[calc(100vh-180px)] overflow-y-auto px-2 py-1">
            {selectedTicket ? (
              <TicketDetails 
                ticketId={selectedTicket} 
                isSelected={true} 
                onTicketUpdate={handleTicketUpdate}
                onTicketDelete={handleTicketDelete}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/20 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
