"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Clock, Upload, FileText, ArrowRight, Loader2 } from "lucide-react"
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

interface Template {
  _id?: string;
  id: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    isRequired?: boolean;
    required?: boolean;
    proofType?: string;
    icon?: string;
  }>;
  stepCount?: number;
  isCustom?: boolean;
}

export function TemplateTaskContent({ templateId }: { templateId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTemplate() {
      console.log('🔍 Fetching template for use with ID:', templateId)
      
      // First try static templates
      const staticTemplate = getTemplateById(templateId)
      if (staticTemplate) {
        console.log('✅ Found static template:', staticTemplate.name)
        setTemplate(staticTemplate)
        setLoading(false)
        return
      }

      // If not found in static templates, fetch from database
      if (!user) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const networkOptions = getNetworkAwareOptions('fast')
        
        console.log('🌐 Fetching custom template from API...')
        const response = await authenticatedFetch<Template>(
          `/api/templates/${templateId}`,
          token,
          { method: 'GET' },
          networkOptions
        )

        if (response.success && response.data) {
          console.log('✅ Found custom template:', response.data.title || response.data.name)
          // Normalize the template structure
          const normalizedTemplate: Template = {
            id: response.data._id || response.data.id,
            _id: response.data._id,
            name: response.data.title || response.data.name,
            description: response.data.description,
            category: response.data.category,
            steps: response.data.steps.map(step => ({
              ...step,
              isRequired: step.required || step.isRequired
            })),
            stepCount: response.data.steps.length,
            isCustom: true
          }
          setTemplate(normalizedTemplate)
        } else {
          console.error('❌ Template not found:', response.error)
          setError('Template not found')
        }
      } catch (error: any) {
        console.error('❌ Error fetching template:', error)
        setError(error.message || 'Failed to load template')
        toast.error('Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId, user])

  const handleStartWorkflow = async () => {
    if (!template || !user) {
      toast.error("Please log in to start workflow")
      return
    }

    setIsSaving(true)
    try {
      const token = await user.getIdToken()
      const networkOptions = getNetworkAwareOptions('fast')

      console.log('🚀 Creating task from template:', template.name)

      // Create task from template data
      const response = await authenticatedFetch<{ task: any }>(
        "/api/tasks/create-from-template",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            title: template.name,
            description: template.description,
            templateData: {
              id: template._id || template.id,
              name: template.name,
              category: template.category,
              steps: template.steps
            },
            dueDate: null
          })
        },
        networkOptions
      )

      if (response.success && response.data) {
        console.log('✅ Task created successfully:', response.data.task._id)
        toast.success("Workflow started!")
        // Redirect to the task details page to execute steps
        router.push(`/dashboard/tasks/${response.data.task._id}`)
      } else {
        throw new Error(response.error || "Failed to create task")
      }
    } catch (error: any) {
      console.error("❌ Error creating task:", error)
      toast.error(error.message || "Failed to start workflow")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
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
              <CardContent className="pt-6 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading template...</span>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !template) {
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
                <p className="text-center text-muted-foreground">
                  {error || 'Template not found'}
                </p>
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
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
                        {template.isCustom && (
                          <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20">
                            Custom Template
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">{template.stepCount || template.steps.length} Steps</Badge>
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
                        {(step.isRequired || step.required) && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
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
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Workflow
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
