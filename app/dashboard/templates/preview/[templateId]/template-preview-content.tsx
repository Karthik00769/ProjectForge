"use client"

import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTemplateById } from "../../template-config"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { authenticatedFetch, getNetworkAwareOptions } from "@/lib/network-utils"
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

export function TemplatePreviewContent({ templateId }: { templateId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTemplate() {
      console.log('🔍 Fetching template with ID:', templateId)
      
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
                        <p className="text-sm text-foreground/60 mt-2">Category: {template.category}</p>
                        {template.isCustom && (
                          <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20">
                            Custom Template
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">{template.stepCount || template.steps.length} Steps</Badge>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Steps Preview */}
              <motion.div variants={fadeInUp} className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Workflow Steps</h2>
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
                        {(step.isRequired || step.required) && <Badge variant="default">Required</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          <strong>Proof Type:</strong>{" "}
                          {step.proofType === "both" ? "Photo or PDF" : step.proofType === "photo" ? "Photo" : "PDF"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeInUp} className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => router.push(`/dashboard/templates/${template._id || template.id}`)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
