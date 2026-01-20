"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Clock, Upload, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { getTemplateById } from "../template-config"
import { useAuth } from "@/contexts/AuthContext"
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

export function TemplateTaskContent({ templateId }: { templateId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const template = getTemplateById(templateId)

  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [currentStepNotes, setCurrentStepNotes] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [dragActive, setDragActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const saveTask = async () => {
    if (!template || !user) {
      toast.error("Please log in to save tasks")
      return
    }

    setIsSaving(true)
    try {
      const token = await user.getIdToken()

      // Create task from frontend template data
      const response = await fetch("/api/tasks/create-from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: template.name,
          description: template.description,
          templateData: {
            id: template.id,
            name: template.name,
            category: template.category,
            steps: template.steps
          },
          dueDate: null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create task")
      }

      const { task } = await response.json()
      toast.success("Task created successfully!")

      // Redirect to the task details page
      router.push(`/dashboard/tasks/${task._id}`)
    } catch (error: any) {
      console.error("Error creating task:", error)
      toast.error(error.message || "Failed to create task")
    } finally {
      setIsSaving(false)
    }
  }

  if (!template) {
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
                <p className="text-center text-muted-foreground">Template not found</p>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => (prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent, stepId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      setUploadedFiles((prev) => ({ ...prev, [stepId]: files[0] }))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, stepId: string) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFiles((prev) => ({ ...prev, [stepId]: e.target.files![0] }))
    }
  }

  const progressPercentage = (completedSteps.length / template.steps.length) * 100

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
                Back to Templates
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-4xl">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Header */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground mb-2">{template.name}</h1>
                        <p className="text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="secondary">{template.stepCount} Steps</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {completedSteps.length} of {template.steps.length} steps
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Steps Section */}
              <motion.div variants={fadeInUp} className="space-y-4">
                {template.steps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{step.name}</CardTitle>
                            <CardDescription>{step.description}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant={completedSteps.includes(step.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStepComplete(step.id)}
                          className="flex-shrink-0"
                        >
                          {completedSteps.includes(step.id) ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-2" />
                              Pending
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    {completedSteps.includes(step.id) && (
                      <CardContent className="space-y-4 pt-0">
                        {/* File Upload */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Upload Proof (Optional)
                          </label>
                          <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={(e) => handleDrop(e, step.id)}
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                              ? "border-primary bg-primary/5"
                              : uploadedFiles[step.id]
                                ? "border-green-300 bg-green-50"
                                : "border-border bg-background"
                              }`}
                          >
                            {uploadedFiles[step.id] ? (
                              <div className="space-y-2">
                                <FileText className="w-8 h-8 text-green-600 mx-auto" />
                                <p className="font-medium text-foreground">{uploadedFiles[step.id].name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(uploadedFiles[step.id].size / 1024).toFixed(2)} KB
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setUploadedFiles((prev) => {
                                      const { [step.id]: _, ...rest } = prev
                                      return rest
                                    })
                                  }
                                >
                                  Change File
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="font-medium text-foreground">Drag and drop files here</p>
                                <input
                                  type="file"
                                  onChange={(e) => handleFileInput(e, step.id)}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Button variant="outline" size="sm" asChild>
                                  <span>Select File</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Step Notes (Optional)
                          </label>
                          <Textarea
                            placeholder="Add any notes or details about this step..."
                            value={currentStepNotes[step.id] || ""}
                            onChange={(e) => setCurrentStepNotes((prev) => ({ ...prev, [step.id]: e.target.value }))}
                            className="min-h-20"
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeInUp} className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={completedSteps.length === 0 || isSaving}
                  onClick={saveTask}
                >
                  {isSaving ? "Saving..." : "Save Task Progress"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
