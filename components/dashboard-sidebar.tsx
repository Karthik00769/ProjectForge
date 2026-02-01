"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const sidebarItems = [
    { title: "Dashboard", icon: "📊", href: "/dashboard" },
    { title: "Create Task", icon: "➕", href: "/dashboard/create-task" },
    { title: "My Tasks", icon: "✓", href: "/dashboard/tasks" },
    { title: "Templates", icon: "📑", href: "/dashboard/templates" },
    { title: "Audit Logs", icon: "📋", href: "/dashboard/audit-logs" },
    { title: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ]

  // Determine active state based on current pathname
  const getIsActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const { user, mongoUser, logout } = useAuth()
  const displayName = mongoUser?.displayName || user?.displayName || "User"
  const email = mongoUser?.email || user?.email || ""
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="text-lg font-bold text-foreground px-2">
          ProjectForge
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                isActive={getIsActive(item.href)} 
                tooltip={item.title} 
                asChild
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className={isMobile ? "text-sm" : "text-base"}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />
      
      <SidebarFooter>
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={mongoUser?.photoURL || user?.photoURL || ""} />
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 mx-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}