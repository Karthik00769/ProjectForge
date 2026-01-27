"use client"

import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Flag, Clock, Download, MoreVertical, ShieldCheck } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, mongoUser, logout } = useAuth()
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, flagged: 0, securityEvents: 0 })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/dashboard/stats?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchStats();

      // Implement Real-Time Sync via SSE
      let eventSource: EventSource | null = null;

      const setupSSE = async () => {
        const token = await user.getIdToken();
        eventSource = new EventSource(`/api/sync/events?token=${token}`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "update") {
            console.log("Real-time update received:", data.action);
            fetchStats();
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          // Attempt reconnect after 5s if error
          setTimeout(setupSSE, 5000);
        };
      };

      setupSSE();

      return () => {
        eventSource?.close();
      };
    }
  }, [user]);

  const handleExportStats = async () => {
    // FIX 2: Fetch LIVE data
    let freshStats = { ...stats };
    try {
      const token = await user?.getIdToken();
      if (token) {
        const res = await fetch(`/api/dashboard/stats?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Assuming API returns { stats: { total, verified, pending, securityEvents, ... } }
          // We map API response to our local stats structure if needed, or just use it.
          // API actually returns "stats" object as per our view_file of route.ts earlier.
          freshStats = data.stats;

          // Also update UI state while we are at it, though not strictly required for PDF fix alone
          setStats(freshStats);
          if (data.recentActivity) setRecentActivity(data.recentActivity);
        }
      }
    } catch (e) {
      console.error("Failed to fetch live stats for PDF", e);
      // Fallback to current state
    }

    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.text("ProjectForge Performance Report", 14, 20)
    doc.setFontSize(12)
    doc.text(`User Index: ${mongoUser?.email || user?.email}`, 14, 32)
    doc.text(`Report Period: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 14, 40)
    doc.text(`Generated: ${new Date().toLocaleTimeString()}`, 14, 48)

    const statsData = [
      ["Stat Title", "Value", "Description"],
      ["Total Tasks", freshStats.total.toString(), "Active tasks this month"],
      ["Verified Tasks", freshStats.verified.toString(), "Successfully verified"],
      ["Security Events", (freshStats.securityEvents || 0).toString(), "Recorded in audit trail"]
      // REMOVED Flagged Tasks
    ]

    autoTable(doc, {
      head: [statsData[0]],
      body: statsData.slice(1),
      startY: 50,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [79, 70, 229] }
    })

    doc.text("Recent Highlights:", 14, (doc as any).lastAutoTable.finalY + 15)

    const activityRows = recentActivity.slice(0, 5).map(a => [
      new Date(a.timestamp).toLocaleString(),
      a.title,
      a.status
    ])

    autoTable(doc, {
      head: [["Timestamp", "Activity", "Result"]],
      body: activityRows,
      startY: (doc as any).lastAutoTable.finalY + 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 65, 81] }
    })

    doc.save(`projectforge-stats-${Date.now()}.pdf`)
    toast.success("Performance report downloaded")
  }

  const overviewCards = [
    {
      title: "Total Tasks",
      value: stats.total.toString(),
      description: "Active tasks this month",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Verified Tasks",
      value: stats.verified.toString(),
      description: "Successfully verified",
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Security Events",
      value: stats.securityEvents || 0,
      description: "Recorded in audit trail",
      icon: ShieldCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ]

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleExportStats}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={logout}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Overview Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                {overviewCards.map((card, i) => {
                  const IconComponent = card.icon
                  return (
                    <motion.div key={i} variants={fadeInUp}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                          <div>
                            <CardTitle className="text-sm font-medium text-foreground/70">{card.title}</CardTitle>
                            <CardDescription className="mt-1">{card.description}</CardDescription>
                          </div>
                          <IconComponent className={`w-5 h-5 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{card.value}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Activity Section */}
                <motion.div variants={fadeInUp}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest task updates and verification status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-10">
                            <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : recentActivity.length > 0 ? (
                          recentActivity.map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                              <div className="mt-1">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {item.title}
                                  </p>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                                <p className="text-[10px] text-muted-foreground/60">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 opacity-50">No activity yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Task Status Breakdown */}
                <motion.div variants={fadeInUp}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Task Status Overview</CardTitle>
                      <CardDescription>Breakdown of current task verification states</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[
                          { label: "Verified", value: stats.verified, total: stats.total, color: "bg-green-600" },
                          { label: "Pending", value: stats.pending, total: stats.total, color: "bg-blue-600" },
                        ].map((status, i) => {
                          const percentage = status.total > 0 ? (status.value / status.total) * 100 : 0
                          return (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{status.label}</span>
                                <span className="text-muted-foreground">
                                  {status.value} of {status.total} tasks ({Math.round(percentage)}%)
                                </span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                  className={`h-full ${status.color}`}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
