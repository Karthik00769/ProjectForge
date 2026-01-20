"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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

interface CustomStep {
  id: string
  name: string
  description: string
  isRequired: boolean
  proofType: "photo" | "pdf" | "both"
  order: number
}

export function CustomTemplateBuilder() {
  const router = useRouter()
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("")
  const [steps, setSteps] = useState<CustomStep[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuth()


  const addStep = () => {
    const newStep: CustomStep = {
      id: `step-${Date.now()}`,
      name: "",
      description: "",
      isRequired: true,
      proofType: "both",
      order: steps.length + 1,
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (id: string, updates: Partial<CustomStep>) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, ...updates } : step)))
  }

  const deleteStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id).map((step, i) => ({ ...step, order: i + 1 })))
  }

  const handleSuggestSteps = async () => {
    if (!templateName) {
      toast.error("Please enter a template name first to get suggestions.")
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: templateName })
      })

      if (res.ok) {
        const data = await res.json()
        const suggestedSteps = data.steps || data

        if (!Array.isArray(suggestedSteps) || suggestedSteps.length === 0) {
          toast.error("No steps were generated. Please try a different job title.")
          return
        }

        const newSteps: CustomStep[] = suggestedSteps.map((s: any, i: number) => ({
          id: `step-${Date.now()}-${i}`,
          name: s.title || s.name,
          description: s.description,
          isRequired: true,
          proofType: "both",
          order: steps.length + i + 1
        }))
        setSteps([...steps, ...newSteps])
        toast.success(`Added ${newSteps.length} AI-suggested steps!`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to generate AI suggestions")
      }
    } catch (err: any) {
      console.error("AI Suggestion Error:", err)
      toast.error(err.message || "Failed to generate AI suggestions")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveTemplate = async () => {
    if (!templateName || !templateCategory || steps.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!user) {
      toast.error("Please log in to save templates")
      return
    }

    setIsSaving(true)
    try {
      const token = await user.getIdToken()

      if (!token) {
        throw new Error("Failed to get authentication token")
      }

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: templateName,
          category: templateCategory,
          steps: steps.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            required: s.isRequired,
            proofType: s.proofType
          }))
        })
      })

      if (res.ok) {
        toast.success("Custom template saved! You can now use it to create tasks.")
        router.push("/dashboard/templates")
      } else {
        const error = await res.json()
        console.error("Template save error:", error)
        toast.error(error.error || "Failed to save template")
      }
    } catch (err: any) {
      console.error("Save Template Error:", err)
      toast.error(err.message || "An error occurred while saving the template.")
    } finally {
      setIsSaving(false)
    }
  }


  const categories = [
    "Business & Client Delivery",
    "Skilled & Field Work",
    "Freelancers & Creators",
    "Construction & Infrastructure",
    "Sales / Operations / Office Work",
    "General Purpose",
    "Custom",
  ]

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
                Back
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Create Custom Template</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-4xl">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Template Info */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Template Information</CardTitle>
                    <CardDescription>Define your custom template name and category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-foreground mb-2 block">Template Name</label>
                        <Input
                          placeholder="e.g., Project Handoff Verification"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSuggestSteps}
                        disabled={isGenerating || !templateName}
                      >
                        {isGenerating ? "Generating..." : "Suggest Steps with AI"}
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                      <Select value={templateCategory} onValueChange={setTemplateCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Steps Builder */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Workflow Steps</CardTitle>
                      <CardDescription>Define the steps for your template</CardDescription>
                    </div>
                    <Badge variant="secondary">{steps.length} steps</Badge>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {steps.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No steps added yet. Click "Add Step" to begin.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {steps.map((step, index) => (
                          <Card key={step.id} className="border-l-4 border-l-primary p-4">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0 mt-1">
                                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div className="text-sm font-semibold text-foreground/70">Step {index + 1}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteStep(step.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Step Title</label>
                                <Input
                                  placeholder="e.g., Client Approval"
                                  value={step.name}
                                  onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                                <Textarea
                                  placeholder="Describe what this step involves..."
                                  value={step.description}
                                  onChange={(e) => updateStep(step.id, { description: e.target.value })}
                                  className="min-h-20"
                                />
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    Proof Type Required
                                  </label>
                                  <Select
                                    value={step.proofType}
                                    onValueChange={(value: "photo" | "pdf" | "both") =>
                                      updateStep(step.id, { proofType: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="photo">Photo Only</SelectItem>
                                      <SelectItem value="pdf">PDF Only</SelectItem>
                                      <SelectItem value="both">Photo or PDF</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-end">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`required-${step.id}`}
                                      checked={step.isRequired}
                                      onCheckedChange={(checked) => updateStep(step.id, { isRequired: !!checked })}
                                    />
                                    <Label
                                      htmlFor={`required-${step.id}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Required Step
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <Button onClick={addStep} variant="outline" className="w-full bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeInUp} className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveTemplate}
                  disabled={!templateName || !templateCategory || steps.length === 0 || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Custom Template"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
