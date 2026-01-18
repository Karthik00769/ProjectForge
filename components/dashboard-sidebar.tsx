"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
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

export function DashboardSidebar() {
  const pathname = usePathname()

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

  const { user, mongoUser } = useAuth()
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
              <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.title} asChild>
                <Link href={item.href}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-foreground/60 truncate">{email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
