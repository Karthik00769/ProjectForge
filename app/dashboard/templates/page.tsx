"use client"
import { motion } from "framer-motion"
import { Briefcase, Zap, ArrowRight, Copy, CheckCircle2, Eye, Wifi, WifiOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TEMPLATES, TEMPLATE_CATEGORIES } from "./template-config"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { networkFetch, authenticatedFetch, ConnectionMonitor, getNetworkAwareOptions } from "@/lib/network-utils"
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

export default function TemplatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [customTemplates, setCustomTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<string>('fast')
  const [error, setError] = useState<string | null>(null)

  // Monitor connection quality
  useEffect(() => {
    const monitor = ConnectionMonitor.getInstance()
    const unsubscribe = monitor.onQualityChange(setConnectionQuality)
    const stopMonitoring = monitor.startMonitoring()

    return () => {
      unsubscribe()
      stopMonitoring()
    }
  }, [])

  // Fetch custom templates with network stability
  useEffect(() => {
    async function fetchCustomTemplates() {
      if (!user) return

      try {
        setError(null)
        const token = await user.getIdToken()
        const networkOptions = getNetworkAwareOptions(connectionQuality)
        
        const response = await authenticatedFetch<any[]>(
          '/api/templates',
          token,
          { method: 'GET' },
          networkOptions
        )

        if (response.success && response.data) {
          // CRITICAL FIX: Filter to only show user's templates and system templates
          const userTemplates = response.data.filter((t: any) => 
            t.userId === user.uid || t.isSystemTemplate === true
          )
          setCustomTemplates(userTemplates)
        } else {
          throw new Error(response.error || 'Failed to fetch templates')
        }
      } catch (error: any) {
        console.error('Error fetching custom templates:', error)
        setError(error.message || 'Failed to load templates')
        toast.error('Failed to load custom templates. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCustomTemplates()
  }, [user, connectionQuality])

  const handleUseTemplate = (templateId: string) => {
    router.push(`/dashboard/templates/${templateId}`)
  }

  const handlePreviewTemplate = (templateId: string) => {
    router.push(`/dashboard/templates/preview/${templateId}`)
  }

  // Merge static templates with custom templates from MongoDB
  const allTemplates = [
    ...TEMPLATES,
    ...customTemplates.map((t: any) => ({
      id: t._id,
      _id: t._id,
      name: t.title,
      description: t.description || 'Custom template',
      category: t.category,
      steps: t.steps,
      stepCount: t.steps?.length || 0,
      isCustom: true
    }))
  ]

  const groupedTemplates = TEMPLATE_CATEGORIES.map((cat) => ({
    ...cat,
    templates: allTemplates.filter((t) => t.category === cat.category),
  }))

  // Connection quality indicator
  const ConnectionIndicator = () => {
    const getIndicatorProps = () => {
      switch (connectionQuality) {
        case 'slow':
          return { icon: Wifi, color: 'text-yellow-600', text: 'Slow Connection' }
        case 'unstable':
          return { icon: WifiOff, color: 'text-red-600', text: 'Unstable Connection' }
        default:
          return { icon: Wifi, color: 'text-green-600', text: 'Good Connection' }
      }
    }

    const { icon: Icon, color, text } = getIndicatorProps()
    
    return (
      <div className={`flex items-center gap-2 text-sm ${color}`}>
        <Icon className="w-4 h-4" />
        <span>{text}</span>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between h-16 px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-foreground">Task Templates</h1>
              </div>
              <ConnectionIndicator />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <div className="space-y-8">
              <div className="text-center">
                <Skeleton className="h-8 w-64 mx-auto mb-3" />
                <Skeleton className="h-4 w-96 mx-auto" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-6">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((j) => (
                      <Card key={j} className="h-64">
                        <CardHeader>
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              <h1 className="text-xl font-semibold text-foreground">Task Templates</h1>
            </div>
            <ConnectionIndicator />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
              {/* Hero Section */}
              <motion.div variants={fadeInUp} className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-3">Task Templates</h2>
                <p className="text-foreground/60 max-w-2xl mx-auto">
                  Choose from 20+ pre-built templates with guided workflow steps. Start faster with proven task
                  structures that include all necessary verification steps.
                </p>
              </motion.div>

              {/* Template Categories */}
              {groupedTemplates.map((category: any, categoryIndex) => {
                const IconComponent = category.icon === "Briefcase" ? Briefcase : Zap
                return (
                  <motion.div key={categoryIndex} variants={fadeInUp} className="space-y-6">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-lg bg-secondary`}>
                        <IconComponent className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{category.category}</h3>
                        <p className="text-sm text-foreground/60">{category.description}</p>
                      </div>
                    </div>

                    {/* Template Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {category.templates.map((template: any) => (
                        <motion.div key={template._id || template.id} variants={fadeInUp}>
                          <Card className="h-full hover:shadow-lg transition-shadow flex flex-col">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                {template.isCustom && (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{template.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                              {/* Predefined Steps */}
                              <div className="mb-6 flex-1">
                                <p className="text-xs font-semibold text-foreground/70 mb-3 uppercase">
                                  Predefined Steps
                                </p>
                                <div className="space-y-2">
                                  {template.steps.slice(0, 3).map((step: any) => (
                                    <div key={step.id || step.name} className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-sm text-foreground">{step.name}</span>
                                    </div>
                                  ))}
                                  {template.steps.length > 3 && (
                                    <p className="text-xs text-foreground/60 ml-6">
                                      +{template.steps.length - 3} more steps
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="mt-4">
                                  {template.stepCount || template.steps.length} steps
                                </Badge>
                              </div>

                              {/* CTA Buttons */}
                              <div className="space-y-2">
                                <Button onClick={() => handleUseTemplate(template.id)} className="w-full">
                                  <Copy className="w-4 h-4 mr-2" />
                                  Use Template
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handlePreviewTemplate(template.id)}
                                  className="w-full"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview Steps
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}

              {/* Create Custom Template Section */}
              <motion.div variants={fadeInUp}>
                <Card className="border-2 border-dashed border-border">
                  <CardHeader>
                    <CardTitle>Create Custom Template</CardTitle>
                    <CardDescription>Design your own reusable template for custom workflows</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => router.push("/dashboard/templates/create-custom")}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Create Custom Template
                    </Button>
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
