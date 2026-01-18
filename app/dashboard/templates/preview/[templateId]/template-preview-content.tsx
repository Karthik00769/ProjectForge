"use client"

import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTemplateById } from "../../template-config"

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

export function TemplatePreviewContent({ templateId }: { templateId: string }) {
  const router = useRouter()
  const template = getTemplateById(templateId)

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
                      </div>
                      <Badge variant="secondary">{template.stepCount} Steps</Badge>
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
                        {step.isRequired && <Badge variant="default">Required</Badge>}
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
                <Button className="flex-1" onClick={() => router.push(`/dashboard/templates/${template.id}`)}>
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
