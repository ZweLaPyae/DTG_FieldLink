"use client"

import { DashboardLayout } from "@/components/dashboard-layout"

export default function AdminManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Management</h1>
          <p className="text-muted-foreground">Manage administrator accounts and permissions.</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-6 text-muted-foreground">
          Admin management tools will appear here.
        </div>
      </div>
    </DashboardLayout>
  )
}
