"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Clock, Upload, FileText, ArrowRight } from "lucide-react"
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
  const [isSaving, setIsSaving] = useState(false)

  const handleStartWorkflow = async () => {
    if (!template || !user) {
      toast.error("Please log in to start workflow")
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
      toast.success("Workflow started!")

      // Redirect to the task details page to execute steps
      router.push(`/dashboard/tasks/${task._id}`)
    } catch (error: any) {
      console.error("Error creating task:", error)
      toast.error(error.message || "Failed to start workflow")
    } finally {
      setIsSaving(false)
    }
  }

  if (!template) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Template not found</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
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
                    <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                      <FileText className="w-4 h-4" />
                      <span>This template will create a new proof workflow. You can upload evidence for each step on the next screen.</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Steps List (Read Only) */}
              <motion.div variants={fadeInUp} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Workflow Steps</h3>
                {template.steps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-secondary">
                    <CardHeader className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-sm">{step.name}</h4>
                          <p className="text-muted-foreground text-xs">{step.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeInUp} className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={isSaving}
                  onClick={handleStartWorkflow}
                >
                  {isSaving ? "Starting..." : "Start Workflow"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
