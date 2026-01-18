"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Clock, FileText, Upload, X, Copy, Share2, Lock, Globe, Mail } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

// Mock task data keyed by taskId
const taskDataMap: Record<string, any> = {
  "1": {
    id: 1,
    title: "API Integration Setup",
    description: "Set up REST API endpoints for user authentication with OAuth2 support",
    templateId: "professional-services", // Map to template
    status: "completed",
    dueDate: "2025-02-15",
    completionDate: "2025-02-10",
    steps: [
      {
        id: "step-1",
        name: "Planning & Design",
        status: "completed",
        uploadedFile: "api-plan.pdf",
        uploadedDate: "2025-02-08",
      },
      {
        id: "step-2",
        name: "API Development",
        status: "completed",
        uploadedFile: "api-code.pdf",
        uploadedDate: "2025-02-09",
      },
      {
        id: "step-3",
        name: "Testing & Validation",
        status: "completed",
        uploadedFile: "test-report.pdf",
        uploadedDate: "2025-02-10",
      },
    ],
  },
  "2": {
    id: 2,
    title: "Design System v2",
    description: "Complete redesign of component library",
    templateId: "skilled-worker",
    status: "in-progress",
    dueDate: "2025-02-20",
    completionDate: null,
    steps: [
      {
        id: "step-1",
        name: "Design Phase",
        status: "completed",
        uploadedFile: "designs.zip",
        uploadedDate: "2025-02-09",
      },
      { id: "step-2", name: "Component Development", status: "in-progress", uploadedFile: null, uploadedDate: null },
      { id: "step-3", name: "Testing & QA", status: "pending", uploadedFile: null, uploadedDate: null },
    ],
  },
  "3": {
    id: 3,
    title: "Database Optimization",
    description: "Optimize query performance",
    templateId: "professional-services",
    status: "in-progress",
    dueDate: "2025-02-25",
    completionDate: null,
    steps: [
      { id: "step-1", name: "Analysis", status: "pending", uploadedFile: null, uploadedDate: null },
      { id: "step-2", name: "Implementation", status: "pending", uploadedFile: null, uploadedDate: null },
      { id: "step-3", name: "Verification", status: "pending", uploadedFile: null, uploadedDate: null },
    ],
  },
  "4": {
    id: 4,
    title: "Security Audit",
    description: "Complete security assessment",
    templateId: "professional-services",
    status: "completed",
    dueDate: "2025-02-05",
    completionDate: "2025-02-06",
    steps: [
      {
        id: "step-1",
        name: "Vulnerability Scan",
        status: "completed",
        uploadedFile: "scan-results.pdf",
        uploadedDate: "2025-02-05",
      },
      {
        id: "step-2",
        name: "Penetration Testing",
        status: "completed",
        uploadedFile: "pentest-report.pdf",
        uploadedDate: "2025-02-06",
      },
      {
        id: "step-3",
        name: "Report Generation",
        status: "completed",
        uploadedFile: "security-audit.pdf",
        uploadedDate: "2025-02-06",
      },
    ],
  },
  "5": {
    id: 5,
    title: "Testing Framework Setup",
    description: "Configure Jest and Cypress",
    templateId: "business-operations",
    status: "completed",
    dueDate: "2025-02-12",
    completionDate: "2025-02-12",
    steps: [
      {
        id: "step-1",
        name: "Jest Configuration",
        status: "completed",
        uploadedFile: "jest-config.pdf",
        uploadedDate: "2025-02-11",
      },
      {
        id: "step-2",
        name: "Cypress Setup",
        status: "completed",
        uploadedFile: "cypress-config.pdf",
        uploadedDate: "2025-02-12",
      },
      {
        id: "step-3",
        name: "Documentation",
        status: "completed",
        uploadedFile: "testing-guide.pdf",
        uploadedDate: "2025-02-12",
      },
    ],
  },
}

export function TaskDetailsContent({ taskId }: { taskId: string }) {
  const router = useRouter()
  const task = taskDataMap[taskId]
  const [uploadingSteps, setUploadingSteps] = useState<Record<string, File | null>>({})
  const [proofLinkVisibility, setProofLinkVisibility] = useState<"private" | "restricted" | "public">("private")
  const [restrictedEmails, setRestrictedEmails] = useState("")
  const [proofLinkId] = useState(() => {
    // Generate a unique proof link for completed tasks
    if (task && task.status === "completed") {
      return Math.random().toString(36).substr(2, 16)
    }
    return null
  })
  const proofShareUrl = proofLinkId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${proofLinkId}`
    : ""

  if (!task) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
            <div className="flex items-center h-16 px-6 lg:px-8 gap-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Task not found</p>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  const completedSteps = task.steps.filter((step: any) => step.status === "completed").length
  const totalSteps = task.steps.length
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100)

  const handleStepUpload = (stepId: string, file: File) => {
    setUploadingSteps((prev) => ({ ...prev, [stepId]: file }))
  }

  const handleRemoveUpload = (stepId: string) => {
    setUploadingSteps((prev) => {
      const newState = { ...prev }
      delete newState[stepId]
      return newState
    })
  }

  const copyProofLink = () => {
    navigator.clipboard.writeText(proofShareUrl)
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tasks
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <motion.div initial="initial" animate="animate" className="space-y-6">
              {/* Task Header */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h1 className="text-3xl font-bold text-foreground">{task.title}</h1>
                        </div>
                        <p className="text-muted-foreground">{task.description}</p>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground font-medium">Progress</p>
                          <p className="text-sm font-semibold text-foreground">
                            {completedSteps} / {totalSteps} steps
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full bg-green-600 transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{progressPercentage}% complete</p>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                          <p className="text-sm font-medium text-foreground">{task.dueDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Completion Date</p>
                          <p className="text-sm font-medium text-foreground">{task.completionDate || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Steps</p>
                          <p className="text-sm font-medium text-foreground">{totalSteps}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="text-sm font-medium text-foreground">
                            {task.status === "completed" ? "Completed" : "In Progress"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Steps Execution Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Task Steps</CardTitle>
                    <CardDescription>Complete each step by uploading required proof</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {task.steps.map((step: any, index: number) => (
                        <div key={step.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{step.name}</h4>
                                <div className="flex items-center gap-2 mt-1">{getStepStatusBadge(step.status)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {step.status === "completed" ? (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-900">{step.uploadedFile}</p>
                                    <p className="text-xs text-green-700">Uploaded on {step.uploadedDate}</p>
                                  </div>
                                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                {uploadingSteps[step.id] ? (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">
                                      {uploadingSteps[step.id]!.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {(uploadingSteps[step.id]!.size / 1024).toFixed(2)} KB
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => handleRemoveUpload(step.id)}>
                                      <X className="w-4 h-4 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-foreground font-medium">Upload Proof</p>
                                    <p className="text-xs text-muted-foreground">Click to select photo or PDF</p>
                                    <input
                                      type="file"
                                      accept=".pdf,image/*"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleStepUpload(step.id, e.target.files[0])
                                        }
                                      }}
                                      className="hidden"
                                      id={`upload-${step.id}`}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => document.getElementById(`upload-${step.id}`)?.click()}
                                    >
                                      <Upload className="w-4 h-4 mr-1" />
                                      Select File
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}

                            {step.status !== "completed" && uploadingSteps[step.id] && (
                              <Button className="w-full" size="sm">
                                Mark Step Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Auto-complete message when all steps done */}
              {task.status === "completed" && (
                <motion.div variants={fadeInUp}>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-900">Task Complete</p>
                          <p className="text-sm text-green-700">
                            All steps have been completed and verified. Proof link is ready for sharing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Proof Link Sharing Section */}
              {task.status === "completed" && proofLinkId && (
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Share Verified Proof</CardTitle>
                      <CardDescription>Control who can view your verification link</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Visibility Badge */}
                      <Alert>
                        <Share2 className="h-4 w-4" />
                        <AlertDescription>
                          Your proof link has been automatically generated. Choose who can access it below.
                        </AlertDescription>
                      </Alert>

                      {/* Visibility Control */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Link Visibility</label>
                        <Select
                          value={proofLinkVisibility}
                          onValueChange={(value: any) => setProofLinkVisibility(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Private - Only you can view
                              </div>
                            </SelectItem>
                            <SelectItem value="restricted">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Restricted - Selected emails only
                              </div>
                            </SelectItem>
                            <SelectItem value="public">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Public - Anyone with link
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Restricted Emails Input */}
                      {proofLinkVisibility === "restricted" && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground">Allowed Emails</label>
                          <Input
                            placeholder="Enter emails separated by commas"
                            value={restrictedEmails}
                            onChange={(e) => setRestrictedEmails(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">e.g., client@company.com, manager@company.com</p>
                        </div>
                      )}

                      {/* Shareable Link */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Proof Link</label>
                        <div className="flex gap-2">
                          <Input value={proofShareUrl} readOnly className="text-xs" />
                          <Button variant="outline" size="icon" onClick={copyProofLink} title="Copy to clipboard">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this link to verify your proof with others
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
