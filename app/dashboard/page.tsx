"use client"
import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Flag, Clock, Download, MoreVertical } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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
  const overviewCards = [
    {
      title: "Total Tasks",
      value: "24",
      description: "Active tasks this month",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Verified Tasks",
      value: "18",
      description: "Successfully verified",
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Flagged Tasks",
      value: "3",
      description: "Require attention",
      icon: Flag,
      color: "text-orange-600",
    },
  ]

  const recentActivity = [
    {
      title: "Project Setup Complete",
      description: "Verified and uploaded to audit log",
      timestamp: "2 hours ago",
      status: "Verified",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      title: "Design Mockups Submitted",
      description: "Waiting for verification",
      timestamp: "4 hours ago",
      status: "Pending",
      statusColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Code Review Started",
      description: "Flagged for code quality issues",
      timestamp: "6 hours ago",
      status: "Flagged",
      statusColor: "bg-orange-100 text-orange-800",
    },
    {
      title: "Documentation Updated",
      description: "Verified and recorded",
      timestamp: "1 day ago",
      status: "Verified",
      statusColor: "bg-green-100 text-green-800",
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                  <DropdownMenuItem>Preferences</DropdownMenuItem>
                  <DropdownMenuItem>Help & Support</DropdownMenuItem>
                  <DropdownMenuItem>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Overview Cards */}
              <div className="grid md:grid-cols-3 gap-6">
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

              {/* Recent Activity Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest task updates and verification status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                            {activity.status === "Verified" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            {activity.status === "Pending" && <Clock className="w-5 h-5 text-blue-600" />}
                            {activity.status === "Flagged" && <AlertCircle className="w-5 h-5 text-orange-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{activity.title}</h4>
                            <p className="text-sm text-foreground/60 mt-1">{activity.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={activity.statusColor}>{activity.status}</Badge>
                              <span className="text-xs text-foreground/50">{activity.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Task Status Indicators */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Task Status Overview</CardTitle>
                    <CardDescription>Breakdown of current task verification states</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mb-3">
                          <span className="text-2xl font-bold text-green-700">75%</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Verified</h4>
                        <p className="text-sm text-foreground/60 mt-1">18 of 24 tasks</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-3">
                          <span className="text-2xl font-bold text-blue-700">17%</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Pending</h4>
                        <p className="text-sm text-foreground/60 mt-1">4 of 24 tasks</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-3">
                          <span className="text-2xl font-bold text-orange-700">8%</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Flagged</h4>
                        <p className="text-sm text-foreground/60 mt-1">2 of 24 tasks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
