"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, BellRing, CheckCircle, AlertCircle } from "lucide-react"
import { useAdminId } from "@/hooks/useAdminId"
import { useNotifications } from "@/hooks/useNotifications"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsManagementPage() {
  const { adminId } = useAdminId()
  const { toast } = useToast()
  const {
    notificationsEnabled,
    isInitializing,
    initializeNotifications,
    disableNotifications,
  } = useNotifications(adminId ?? undefined)

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Fetch recent ticket changes from admin logs
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-logs?limit=20`
        )
        if (response.ok) {
          const logs = await response.json()
          setRecentActivity(logs)
        }
      } catch (error) {
        console.error("Error fetching recent activity:", error)
      } finally {
        setIsLoadingActivity(false)
      }
    }

    fetchRecentActivity()
  }, [])

  const handleTestNotification = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/send/admin/${adminId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Test Notification 🔔",
            body: "This is a test notification from DTG FieldLink!",
            data: {
              type: "test",
              timestamp: new Date().toISOString(),
            },
          }),
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test notification sent! Check your browser.",
          duration: 3000,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send test notification",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending test notification",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Manage your notification settings and view notification activity
        </p>
      </div>

      {/* Notification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationsEnabled ? (
              <BellRing className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            Notification Status
          </CardTitle>
          <CardDescription>
            {notificationsEnabled
              ? "You are receiving push notifications"
              : "Enable notifications to receive real-time updates"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  notificationsEnabled ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <div>
                <p className="font-medium">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {notificationsEnabled
                    ? "Receiving notifications for ticket updates"
                    : "Click enable to start receiving notifications"}
                </p>
              </div>
            </div>
            <Button
              onClick={
                notificationsEnabled
                  ? disableNotifications
                  : initializeNotifications
              }
              disabled={isInitializing}
              variant={notificationsEnabled ? "outline" : "default"}
            >
              {isInitializing
                ? "Loading..."
                : notificationsEnabled
                ? "Disable"
                : "Enable"}
            </Button>
          </div>

          {notificationsEnabled && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Test Notification</p>
                  <p className="text-sm text-muted-foreground">
                    Send a test notification to verify it's working
                  </p>
                </div>
              </div>
              <Button onClick={handleTestNotification} variant="outline">
                Send Test
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            You will receive notifications for the following events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">New Ticket Created</p>
                <p className="text-sm text-muted-foreground">
                  When a new customer ticket is created in the system
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Ticket Ready for Review</p>
                <p className="text-sm text-muted-foreground">
                  When a technician marks a ticket as ready for review
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Team Assignment</p>
                <p className="text-sm text-muted-foreground">
                  When a ticket is assigned to or reassigned between teams
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Recent changes and updates in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((log: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    {log.adminUser && (
                      <p className="text-xs text-muted-foreground">
                        by {log.adminUser.name || log.adminUser.email}
                      </p>
                    )}
                    {log.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Yangon', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
