"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Ticket, BarChart3, Users, Settings, LogOut, Wifi, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Team", href: "/teams", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const handleLogout = () => {
    window.location.href = "/"
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
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            <div
              className={cn(
                "flex items-center space-x-3 transition-opacity duration-200",
                sidebarOpen ? "opacity-100" : "opacity-0",
              )}
            >
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
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
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
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn("transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0")}>
                    {item.name}
                  </span>
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
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className={cn("ml-3 transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0")}>
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
              <span className={cn("ml-3 transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0")}>
                Sign Out
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
