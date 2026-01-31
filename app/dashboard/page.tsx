"use client"

import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Flag, Clock, Download, MoreVertical, ShieldCheck, Calendar } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authenticatedFetch, getNetworkAwareOptions } from "@/lib/network-utils"

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

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  verifiedTasks: number;
  totalEvents: number;
  monthly: {
    monthKey: string;
    tasksCreated: number;
    tasksCompleted: number;
    tasksPending: number;
    securityEvents: number;
    monthStart: string;
    monthEnd: string;
  };
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, mongoUser, logout } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionQuality, setConnectionQuality] = useState<string>('fast')

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      try {
        setError(null)
        const token = await user.getIdToken();
        const networkOptions = getNetworkAwareOptions(connectionQuality)
        
        const response = await authenticatedFetch<{
          stats: DashboardStats;
          activity: ActivityItem[];
          metadata: any;
        }>(
          `/api/dashboard/stats?t=${Date.now()}`,
          token,
          { method: 'GET' },
          networkOptions
        );

        if (response.success && response.data) {
          setStats(response.data.stats);
          setRecentActivity(response.data.activity || []);
        } else {
          throw new Error(response.error || 'Failed to fetch dashboard stats');
        }
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchStats();

      // Implement Real-Time Sync via SSE with network stability
      let eventSource: EventSource | null = null;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;

      const setupSSE = async () => {
        try {
          const token = await user.getIdToken();
          eventSource = new EventSource(`/api/sync/events?token=${token}`);

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "update") {
                console.log("Real-time update received:", data.action);
                fetchStats();
                reconnectAttempts = 0; // Reset on successful message
              }
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          };

          eventSource.onerror = () => {
            eventSource?.close();
            
            // Exponential backoff for reconnection
            if (reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
              reconnectAttempts++;
              setTimeout(setupSSE, delay);
            }
          };

          eventSource.onopen = () => {
            reconnectAttempts = 0;
          };
        } catch (e) {
          console.error('Error setting up SSE:', e);
        }
      };

      // Only setup SSE on good connections
      if (connectionQuality !== 'unstable') {
        setupSSE();
      }

      return () => {
        eventSource?.close();
      };
    }
  }, [user, connectionQuality]);

  const handleExportStats = async () => {
    if (!user || !stats) {
      toast.error('No data available for export');
      return;
    }

    try {
      // Fetch fresh data for export
      const token = await user.getIdToken();
      const networkOptions = getNetworkAwareOptions(connectionQuality);
      
      const response = await authenticatedFetch<{
        stats: DashboardStats;
        activity: ActivityItem[];
      }>(
        `/api/dashboard/stats?t=${Date.now()}`,
        token,
        { method: 'GET' },
        networkOptions
      );

      const freshStats = response.success && response.data ? response.data.stats : stats;
      const freshActivity = response.success && response.data ? response.data.activity : recentActivity;

      const doc = new jsPDF();
      (doc as any).autoTable = autoTable;

      doc.setFontSize(22)
      doc.text("ProjectForge Performance Report", 14, 20)
      doc.setFontSize(12)
      doc.text(`User: ${mongoUser?.email || user?.email}`, 14, 32)
      doc.text(`Report Period: ${freshStats.monthly.monthKey}`, 14, 40)
      doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, 48)

      // Monthly Stats Table
      const monthlyStatsData = [
        ["Metric", "This Month", "All Time", "Description"],
        ["Tasks Created", freshStats.monthly.tasksCreated.toString(), freshStats.totalTasks.toString(), "Tasks created this month vs all time"],
        ["Tasks Completed", freshStats.monthly.tasksCompleted.toString(), freshStats.verifiedTasks.toString(), "Successfully verified tasks"],
        ["Tasks Pending", freshStats.monthly.tasksPending.toString(), freshStats.pendingTasks.toString(), "Tasks awaiting completion"],
        ["Security Events", freshStats.monthly.securityEvents.toString(), freshStats.totalEvents.toString(), "Audit log entries"]
      ]

      autoTable(doc, {
        head: [monthlyStatsData[0]],
        body: monthlyStatsData.slice(1),
        startY: 60,
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [79, 70, 229] }
      })

      doc.text("Recent Activity:", 14, (doc as any).lastAutoTable.finalY + 15)

      const activityRows = freshActivity.slice(0, 8).map(a => [
        new Date(a.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        a.title,
        a.status,
        a.description.substring(0, 50) + (a.description.length > 50 ? '...' : '')
      ])

      autoTable(doc, {
        head: [["Timestamp (IST)", "Activity", "Status", "Description"]],
        body: activityRows,
        startY: (doc as any).lastAutoTable.finalY + 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [55, 65, 81] }
      })

      doc.save(`projectforge-report-${freshStats.monthly.monthKey}-${Date.now()}.pdf`)
      toast.success("Performance report downloaded")
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export report. Please try again.');
    }
  }

  // Connection quality indicator - removed as per requirements

  // Loading skeleton
  if (loading) {
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
              <ConnectionIndicator />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <div className="space-y-8">
              <div className="grid md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!stats) {
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
              <ConnectionIndicator />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="text-center py-20">
              <p className="text-muted-foreground">No dashboard data available</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const overviewCards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks.toString(),
      monthlyValue: stats.monthly.tasksCreated.toString(),
      description: "All time / This month",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Verified Tasks",
      value: stats.verifiedTasks.toString(),
      monthlyValue: stats.monthly.tasksCompleted.toString(),
      description: "All time / This month",
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      monthlyValue: stats.monthly.tasksPending.toString(),
      description: "All time / This month",
      icon: AlertCircle,
      color: "text-orange-600",
    },
    {
      title: "Security Events",
      value: stats.totalEvents.toString(),
      monthlyValue: stats.monthly.securityEvents.toString(),
      description: "All time / This month",
      icon: ShieldCheck,
      color: "text-purple-600",
    },
  ]

  // Safe date formatter
  const formatDate = (dateString: string | number | Date) => {
    try {
      if (!dateString) return "Just now"
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Just now"

      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        })
      }
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      })
    } catch (e) {
      return "Just now"
    }
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {stats.monthly.monthKey}
              </Badge>
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
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Overview Cards with Monthly Data */}
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
                          <div className="space-y-1">
                            <div className="text-3xl font-bold text-foreground">{card.value}</div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium text-primary">{card.monthlyValue}</span> this month
                            </div>
                          </div>
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
                        {recentActivity && recentActivity.length > 0 ? (
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
                                  {formatDate(item.timestamp)}
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

                {/* Monthly Progress Breakdown */}
                <motion.div variants={fadeInUp}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Monthly Progress</CardTitle>
                      <CardDescription>Task completion progress for {stats.monthly.monthKey}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[
                          { 
                            label: "Completed", 
                            value: stats.monthly.tasksCompleted, 
                            total: stats.monthly.tasksCreated, 
                            color: "bg-green-600" 
                          },
                          { 
                            label: "Pending", 
                            value: stats.monthly.tasksPending, 
                            total: stats.monthly.tasksCreated, 
                            color: "bg-orange-600" 
                          },
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
                        
                        <div className="pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Security Events:</span>
                              <span className="font-medium">{stats.monthly.securityEvents}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Period:</span>
                              <span className="font-medium">
                                {new Date(stats.monthly.monthStart).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  timeZone: 'Asia/Kolkata'
                                })} - {new Date(stats.monthly.monthEnd).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  timeZone: 'Asia/Kolkata'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
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
