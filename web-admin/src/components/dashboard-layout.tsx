"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FaUsers, FaUserTie } from "react-icons/fa"
import { Menu, X, Home, Ticket, BarChart3, Settings, LogOut, Wifi, Sun, Moon, UserCog, Building2, Users, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { NotificationDropdown } from "@/components/notification-dropdown"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Materials", href: "/dashboard/materials", icon: Package },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Team", href: "/dashboard/teams", icon: FaUsers },
    { name: "Technicians", href: "/dashboard/technicians", icon: FaUserTie },
    { name: "Admin Management", href: "/dashboard/admin-management", icon: UserCog },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            {sidebarOpen ? (
              <>
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-sidebar-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold text-sidebar-foreground">DTG FieldLink</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    sidebarOpen ? "space-x-3" : "justify-center",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent",
                sidebarOpen ? "justify-start" : "justify-center"
              )}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {sidebarOpen && <span className="ml-3">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent",
                sidebarOpen ? "justify-start" : "justify-center"
              )}
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span className="ml-3">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        {/* Header Bar with Notifications */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-6 justify-end space-x-4">
            {session?.user?.id && <NotificationDropdown adminUserId={Number(session.user.id)} />}
          </div>
        </div>
        
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
