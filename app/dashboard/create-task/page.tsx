"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, CheckCircle2, AlertCircle, Copy, Share2, FileText, Loader2, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function CreateTaskPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Form state
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [category, setCategory] = useState("")
  const [deadline, setDeadline] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Task creation state
  const [isCreating, setIsCreating] = useState(false)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)
  const [taskCreated, setTaskCreated] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setUploadedFile(file)
      } else {
        toast.error("Please upload only images or PDF files")
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const createTask = async () => {
    if (!taskTitle) {
      toast.error("Please enter a task title")
      return
    }

    if (!user) {
      toast.error("Please log in to create tasks")
      return
    }

    setIsCreating(true)
    try {
      const token = await user.getIdToken()

      // Create a simple task
      const response = await fetch("/api/tasks/create-from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          templateData: {
            id: `custom-${Date.now()}`,
            name: taskTitle,
            category: category || "General Purpose",
            steps: [
              {
                id: "step-1",
                name: "Upload Proof",
                description: "Upload proof of work completion",
                order: 1,
                isRequired: true,
                proofType: "both"
              }
            ]
          },
          dueDate: deadline || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create task")
      }

      const { task } = await response.json()
      setCreatedTaskId(task._id)
      setTaskCreated(true)

      // If file was uploaded, upload it to the first step
      if (uploadedFile) {
        await uploadProof(task._id, "step-1")
      }

      toast.success("Task created successfully!")
    } catch (error: any) {
      console.error("Error creating task:", error)
      toast.error(error.message || "Failed to create task")
    } finally {
      setIsCreating(false)
    }
  }

  const uploadProof = async (taskId: string, stepId: string) => {
    if (!uploadedFile || !user) return

    try {
      const token = await user.getIdToken()
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const response = await fetch(`/api/tasks/${taskId}/steps/${stepId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        toast.success("Proof uploaded successfully!")
      } else {
        toast.error("Failed to upload proof")
      }
    } catch (error) {
      console.error("Error uploading proof:", error)
      toast.error("Failed to upload proof")
    }
  }

  const viewTask = () => {
    if (createdTaskId) {
      router.push(`/dashboard/tasks/${createdTaskId}`)
    }
  }

  const viewAuditLog = () => {
    router.push("/dashboard/audit-logs")
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Create Task & Verify Proof</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-4xl">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Task Creation Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Task Details</CardTitle>
                    <CardDescription>Create a new task and upload proof of work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Task Title */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Task Title</label>
                        <Input
                          placeholder="e.g., Complete project setup"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          disabled={isCreating || taskCreated}
                        />
                      </div>

                      {/* Task Description */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                        <Textarea
                          placeholder="Describe the task in detail..."
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          disabled={isCreating || taskCreated}
                          className="min-h-24"
                        />
                      </div>

                      {/* Category & Deadline */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Category (Optional)</label>
                          <Select
                            value={category}
                            onValueChange={setCategory}
                            disabled={isCreating || taskCreated}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="documentation">Documentation</SelectItem>
                              <SelectItem value="testing">Testing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Deadline (Optional)</label>
                          <Input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            disabled={isCreating || taskCreated}
                            min={new Date().toISOString().split('T')[0]}
                            max="2099-12-31"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* File Upload Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Proof (Optional)</CardTitle>
                    <CardDescription>Drag and drop or select image and PDF files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                          ? "border-primary bg-primary/5"
                          : uploadedFile
                            ? "border-green-300 bg-green-50"
                            : "border-border bg-background"
                        }`}
                    >
                      {uploadedFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <FileText className="w-10 h-10 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{uploadedFile.name}</p>
                            <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadedFile(null)}
                            disabled={isCreating || taskCreated}
                          >
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Drag and drop your file here</p>
                            <p className="text-sm text-muted-foreground">or click to select</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileInput}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={isCreating || taskCreated}
                          />
                          <Button variant="outline" size="sm" asChild>
                            <span>Select File</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Supported formats: PDF, PNG, JPG, GIF</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Create Button */}
              {!taskCreated && (
                <motion.div variants={fadeInUp}>
                  <Button
                    onClick={createTask}
                    disabled={!taskTitle || isCreating}
                    className="w-full"
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Task...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Create Task
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Success Section */}
              {taskCreated && createdTaskId && (
                <motion.div variants={fadeInUp}>
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="text-green-700">Task Created Successfully!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Your task has been created and saved to the database. {uploadedFile && "Proof has been uploaded."}
                        </AlertDescription>
                      </Alert>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1" onClick={viewTask}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Task Details
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={viewAuditLog}
                        >
                          View Audit Log
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTaskTitle("")
                            setTaskDescription("")
                            setCategory("")
                            setDeadline("")
                            setUploadedFile(null)
                            setTaskCreated(false)
                            setCreatedTaskId(null)
                          }}
                        >
                          Create Another
                        </Button>
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
