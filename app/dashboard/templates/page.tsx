"use client"
import { motion } from "framer-motion"
import { Briefcase, Zap, ArrowRight, Copy, CheckCircle2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TEMPLATES, TEMPLATE_CATEGORIES } from "./template-config"

import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

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
  // We keep useAuth/useState if we want to add features later, but for now reverting to static view
  const { user } = useAuth()

  const handleUseTemplate = (templateId: string) => {
    router.push(`/dashboard/templates/${templateId}`)
  }

  const handlePreviewTemplate = (templateId: string) => {
    router.push(`/dashboard/templates/preview/${templateId}`)
  }

  const groupedTemplates = TEMPLATE_CATEGORIES.map((cat) => ({
    ...cat,
    templates: TEMPLATES.filter((t) => t.category === cat.category),
  }))

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
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
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
                              <CardTitle className="text-lg">{template.name}</CardTitle>
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
                                  {template.stepCount} steps
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
