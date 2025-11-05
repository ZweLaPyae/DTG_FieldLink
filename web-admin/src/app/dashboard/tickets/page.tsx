"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TicketList } from "@/components/ticket-list"
import { TicketDetails } from "@/components/ticket-details"
import { CreateTicketDialog } from "@/components/create-ticket-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"

export default function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tickets</h1>
            <p className="text-muted-foreground">Manage and track maintenance tickets</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TicketList
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              selectedTicket={selectedTicket}
              onSelectTicket={setSelectedTicket}
            />
          </div>
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <TicketDetails ticketId={selectedTicket} />
            ) : (
              <div className="bg-muted/20 border border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>

        <CreateTicketDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </DashboardLayout>
  )
}
