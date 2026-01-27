"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, AlertCircle, Filter, Search, Sparkles, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
// Dialog imports
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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

export default function MyTasksContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map API data if necessary or just use directly.
          // Our API returns Task[] which has steps[].
          // We need to calculate completedSteps on the fly.
          setTasks(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [user]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "pending":
        return <Clock className="w-5 h-5 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return null
    }
  }

  const handleViewDetails = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`)
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">My Tasks</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
              {/* Search & Filter Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Search & Filter Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by task name or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tasks</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tasks Grid */}
              <motion.div variants={fadeInUp}>
                {filteredTasks.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredTasks.map((task, index) => {
                      const completedCount = task.steps ? task.steps.filter((s: any) => s.status === 'completed').length : 0;
                      const totalCount = task.steps ? task.steps.length : 0;
                      const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <motion.div key={task._id || task.id} variants={fadeInUp}>
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      {getStatusIcon(task.status)}
                                      <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                  </div>
                                  {getStatusBadge(task.status)}
                                </div>

                                {/* Progress Indicator */}
                                <div className="space-y-2 pt-2 border-t border-border">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground">Progress</p>
                                    <p className="text-xs font-semibold text-foreground">
                                      {completedCount}/{totalCount} steps
                                    </p>
                                  </div>
                                  <Progress value={progressPercentage} className="h-2" />
                                </div>

                                {/* Details */}
                                <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-border">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Template</p>
                                    <p className="text-sm font-medium text-foreground">Standard Workflow</p>
                                    {/* We didn't store template name in Task, only ID. Future improvement: Populate */}
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                                    <p className="text-sm font-medium text-foreground">
                                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Completion</p>
                                    <p className="text-sm font-medium text-foreground">
                                      {task.completionDate ? new Date(task.completionDate).toLocaleDateString() : "In Progress"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Proof Type</p>
                                    <p className="text-sm font-medium text-foreground">Digital</p>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(task._id)}
                                    className="flex-1"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground py-8">No tasks found matching your filters.</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
