"use client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TicketOverview } from "@/components/ticket-overview"
import { TicketAnalytics } from "@/components/ticket-analytics"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor ticket traffic and system performance</p>
        </div>

        <TicketOverview />
        <TicketAnalytics />
      </div>
    </DashboardLayout>
  )
}
